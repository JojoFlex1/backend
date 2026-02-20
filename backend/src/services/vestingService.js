const { Vault, SubSchedule, Beneficiary } = require('../models');
const { Op } = require('sequelize');

class VestingService {
  async createVault(vaultData) {
    try {
      const {
        address,
        name,
        token_address,
        owner_address,
        initial_amount = 0,
        beneficiaries = []
      } = vaultData;

      // Create the vault
      const vault = await Vault.create({
        address,
        name,
        token_address,
        owner_address,
        total_amount: initial_amount
      });

      // Create initial beneficiaries if provided
      if (beneficiaries.length > 0) {
        for (const beneficiaryData of beneficiaries) {
          await Beneficiary.create({
            vault_id: vault.id,
            address: beneficiaryData.address,
            total_allocated: beneficiaryData.allocation || 0
          });
        }
      }

      return vault;
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  }

  async processTopUp(topUpData) {
    try {
      const {
        vault_address,
        amount,
        cliff_duration_seconds = 0,
        vesting_duration_seconds,
        transaction_hash,
        block_number,
        timestamp = new Date()
      } = topUpData;

      // Find the vault
      const vault = await Vault.findOne({
        where: { address: vault_address }
      });

      if (!vault) {
        throw new Error(`Vault with address ${vault_address} not found`);
      }

      // Calculate start and end timestamps
      const startTimestamp = new Date(timestamp.getTime() + cliff_duration_seconds * 1000);
      const endTimestamp = new Date(timestamp.getTime() + vesting_duration_seconds * 1000);

      // Create sub-schedule for this top-up
      const subSchedule = await SubSchedule.create({
        vault_id: vault.id,
        top_up_amount: amount,
        cliff_duration: cliff_duration_seconds,
        vesting_duration: vesting_duration_seconds,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        transaction_hash,
        block_number
      });

      // Update vault total amount
      await vault.update({
        total_amount: parseFloat(vault.total_amount) + parseFloat(amount)
      });

      return subSchedule;
    } catch (error) {
      console.error('Error processing top-up:', error);
      throw error;
    }
  }

  async getVestingSchedule(vault_address, beneficiary_address = null) {
    try {
      const vault = await Vault.findOne({
        where: { address: vault_address },
        include: [
          {
            model: SubSchedule,
            as: 'subSchedules',
            order: [['created_at', 'ASC']]
          },
          {
            model: Beneficiary,
            as: 'beneficiaries',
            ...(beneficiary_address && {
              where: { address: beneficiary_address }
            })
          }
        ]
      });

      if (!vault) {
        throw new Error(`Vault with address ${vault_address} not found`);
      }

      return vault;
    } catch (error) {
      console.error('Error getting vesting schedule:', error);
      throw error;
    }
  }

  async calculateWithdrawableAmount(vault_address, beneficiary_address, timestamp = new Date()) {
    try {
      const vault = await this.getVestingSchedule(vault_address, beneficiary_address);
      
      if (!vault || vault.beneficiaries.length === 0) {
        return { withdrawable: 0, total_vested: 0, total_allocated: 0 };
      }

      const beneficiary = vault.beneficiaries[0];
      let totalVested = 0;
      let totalWithdrawable = 0;

      // Calculate vested amount from each sub-schedule
      for (const subSchedule of vault.subSchedules) {
        const vestedAmount = this.calculateVestedAmount(subSchedule, timestamp);
        totalVested += vestedAmount;

        // Calculate withdrawable from this sub-schedule
        const withdrawnFromSub = parseFloat(subSchedule.amount_withdrawn);
        const withdrawableFromSub = Math.max(0, vestedAmount - withdrawnFromSub);
        totalWithdrawable += withdrawableFromSub;
      }

      return {
        withdrawable: totalWithdrawable,
        total_vested: totalVested,
        total_allocated: parseFloat(beneficiary.total_allocated),
        total_withdrawn: parseFloat(beneficiary.total_withdrawn)
      };
    } catch (error) {
      console.error('Error calculating withdrawable amount:', error);
      throw error;
    }
  }

  calculateVestedAmount(subSchedule, timestamp = new Date()) {
    const now = new Date(timestamp);
    const start = new Date(subSchedule.start_timestamp);
    const end = new Date(subSchedule.end_timestamp);

    // Before cliff - nothing vested
    if (now < start) {
      return 0;
    }

    // After full vesting - everything vested
    if (now >= end) {
      return parseFloat(subSchedule.top_up_amount);
    }

    // During vesting period - linear vesting
    const totalVestingTime = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    const vestingRatio = elapsedTime / totalVestingTime;

    return parseFloat(subSchedule.top_up_amount) * vestingRatio;
  }

  async processWithdrawal(withdrawalData) {
    try {
      const {
        vault_address,
        beneficiary_address,
        amount,
        transaction_hash,
        block_number,
        timestamp = new Date()
      } = withdrawalData;

      // Get current withdrawable amount
      const vestingInfo = await this.calculateWithdrawableAmount(vault_address, beneficiary_address, timestamp);

      if (parseFloat(amount) > vestingInfo.withdrawable) {
        throw new Error(`Insufficient vested amount. Requested: ${amount}, Available: ${vestingInfo.withdrawable}`);
      }

      // Find the vault and beneficiary
      const vault = await Vault.findOne({
        where: { address: vault_address },
        include: [{
          model: Beneficiary,
          as: 'beneficiaries',
          where: { address: beneficiary_address }
        }]
      });

      if (!vault || vault.beneficiaries.length === 0) {
        throw new Error('Vault or beneficiary not found');
      }

      const beneficiary = vault.beneficiaries[0];

      // Get sub-schedules to distribute withdrawal
      const subSchedules = await SubSchedule.findAll({
        where: {
          vault_id: vault.id,
          start_timestamp: { [Op.lte]: timestamp }
        },
        order: [['created_at', 'ASC']]
      });

      let remainingAmount = parseFloat(amount);
      const withdrawalDistribution = [];

      // Distribute withdrawal across sub-schedules (FIFO)
      for (const subSchedule of subSchedules) {
        if (remainingAmount <= 0) break;

        const vestedAmount = this.calculateVestedAmount(subSchedule, timestamp);
        const alreadyWithdrawn = parseFloat(subSchedule.amount_withdrawn);
        const availableFromSub = vestedAmount - alreadyWithdrawn;

        if (availableFromSub > 0) {
          const withdrawFromSub = Math.min(remainingAmount, availableFromSub);
          withdrawalDistribution.push({
            sub_schedule_id: subSchedule.id,
            amount: withdrawFromSub
          });

          // Update sub-schedule withdrawn amount
          await subSchedule.update({
            amount_withdrawn: alreadyWithdrawn + withdrawFromSub
          });

          remainingAmount -= withdrawFromSub;
        }
      }

      // Update beneficiary total withdrawn
      await beneficiary.update({
        total_withdrawn: parseFloat(beneficiary.total_withdrawn) + parseFloat(amount)
      });

      return {
        success: true,
        amount_withdrawn: parseFloat(amount),
        remaining_withdrawable: vestingInfo.withdrawable - parseFloat(amount),
        distribution: withdrawalDistribution
      };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }

  async getVaultSummary(vault_address) {
    try {
      const vault = await Vault.findOne({
        where: { address: vault_address },
        include: [
          {
            model: SubSchedule,
            as: 'subSchedules'
          },
          {
            model: Beneficiary,
            as: 'beneficiaries'
          }
        ]
      });

      if (!vault) {
        throw new Error(`Vault with address ${vault_address} not found`);
      }

      const summary = {
        vault_address: vault.address,
        token_address: vault.token_address,
        total_amount: parseFloat(vault.total_amount),
        total_top_ups: vault.subSchedules.length,
        total_beneficiaries: vault.beneficiaries.length,
        sub_schedules: vault.subSchedules.map(ss => ({
          id: ss.id,
          top_up_amount: parseFloat(ss.top_up_amount),
          cliff_duration: ss.cliff_duration,
          vesting_duration: ss.vesting_duration,
          start_timestamp: ss.start_timestamp,
          end_timestamp: ss.end_timestamp,
          amount_withdrawn: parseFloat(ss.amount_withdrawn)
        })),
        beneficiaries: vault.beneficiaries.map(b => ({
          address: b.address,
          total_allocated: parseFloat(b.total_allocated),
          total_withdrawn: parseFloat(b.total_withdrawn)
        }))
      };

      return summary;
    } catch (error) {
      console.error('Error getting vault summary:', error);
      throw error;
    }
  }
}

module.exports = new VestingService();
