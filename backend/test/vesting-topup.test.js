const vestingService = require('../src/services/vestingService');
const indexingService = require('../src/services/indexingService');

describe('Vesting Service - Top-up with Cliff Functionality', () => {
  let testVault;
  let adminAddress = '0x1234567890123456789012345678901234567890';
  let vaultAddress = '0x9876543210987654321098765432109876543210';
  let ownerAddress = '0x1111111111111111111111111111111111111111';
  let tokenAddress = '0x2222222222222222222222222222222222222222';

  beforeEach(async () => {
    // Setup test vault
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-01-01');
    
    testVault = await vestingService.createVault(
      adminAddress,
      vaultAddress,
      ownerAddress,
      tokenAddress,
      '1000.0',
      startDate,
      endDate,
      null
    );
  });

  describe('Top-up with Cliff', () => {
    test('Should create sub-schedule with cliff for top-up', async () => {
      const topUpConfig = {
        topUpAmount: '500.0',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        cliffDuration: 86400, // 1 day in seconds
        vestingDuration: 2592000, // 30 days in seconds
      };

      const result = await vestingService.topUpVault(
        adminAddress,
        vaultAddress,
        topUpConfig.topUpAmount,
        topUpConfig.transactionHash,
        topUpConfig.cliffDuration,
        topUpConfig.vestingDuration
      );

      expect(result.success).toBe(true);
      expect(result.subSchedule.cliff_duration).toBe(86400);
      expect(result.subSchedule.cliff_date).toBeInstanceOf(Date);
      expect(result.subSchedule.vesting_duration).toBe(2592000);
      expect(result.vault.total_amount).toBe('1500.0'); // 1000 + 500
    });

    test('Should create sub-schedule without cliff', async () => {
      const topUpConfig = {
        topUpAmount: '300.0',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        cliffDuration: null,
        vestingDuration: 2592000,
      };

      const result = await vestingService.topUpVault(
        adminAddress,
        vaultAddress,
        topUpConfig.topUpAmount,
        topUpConfig.transactionHash,
        topUpConfig.cliffDuration,
        topUpConfig.vestingDuration
      );

      expect(result.success).toBe(true);
      expect(result.subSchedule.cliff_duration).toBeNull();
      expect(result.subSchedule.cliff_date).toBeNull();
      expect(result.subSchedule.vesting_start_date).toBeInstanceOf(Date);
    });

    test('Should calculate releasable amount correctly with cliff', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      
      // Create top-up with 1 day cliff
      await vestingService.topUpVault(
        adminAddress,
        vaultAddress,
        '100.0',
        '0xtest1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        86400, // 1 day cliff
        2592000 // 30 days vesting
      );

      // Test during cliff period (should be 0)
      const duringCliff = await vestingService.calculateReleasableAmount(vaultAddress, pastDate);
      expect(duringCliff.totalReleasable).toBe(0);

      // Test after cliff period
      const afterCliff = await vestingService.calculateReleasableAmount(vaultAddress, now);
      expect(afterCliff.totalReleasable).toBeGreaterThan(0);
    });
  });

  describe('Indexing Service Integration', () => {
    test('Should process top-up event correctly', async () => {
      const topUpData = {
        vault_address: vaultAddress,
        top_up_amount: '200.0',
        transaction_hash: '0xindex1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        block_number: 12345,
        timestamp: new Date().toISOString(),
        cliff_duration: 172800, // 2 days
        vesting_duration: 2592000, // 30 days
      };

      const result = await indexingService.processTopUpEvent(topUpData);

      expect(result).toBeDefined();
      expect(result.top_up_amount).toBe('200.0');
      expect(result.cliff_duration).toBe(172800);
    });

    test('Should process release event correctly', async () => {
      // First create a top-up
      await vestingService.topUpVault(
        adminAddress,
        vaultAddress,
        '100.0',
        '0xreleasetest1234567890abcdef1234567890abcdef1234567890abcdef',
        null, // no cliff
        86400 // 1 day vesting
      );

      // Wait for vesting to complete (simulate with past date)
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const releaseData = {
        vault_address: vaultAddress,
        user_address: ownerAddress,
        amount_released: '50.0',
        transaction_hash: '0xrelease1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        block_number: 12346,
        timestamp: pastDate.toISOString(),
      };

      const result = await indexingService.processReleaseEvent(releaseData);

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe('50.0');
    });
  });

  describe('Error Handling', () => {
    test('Should throw error for invalid vault address', async () => {
      await expect(
        vestingService.topUpVault(
          adminAddress,
          '0xinvalid',
          '100.0',
          '0xtest1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          null,
          86400
        )
      ).rejects.toThrow('Vault not found or inactive');
    });

    test('Should throw error for negative top-up amount', async () => {
      await expect(
        vestingService.topUpVault(
          adminAddress,
          vaultAddress,
          '-100.0',
          '0xtest1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          null,
          86400
        )
      ).rejects.toThrow('Top-up amount must be positive');
    });

    test('Should throw error for invalid transaction hash', async () => {
      await expect(
        vestingService.topUpVault(
          adminAddress,
          vaultAddress,
          '100.0',
          'invalid_hash',
          null,
          86400
        )
      ).rejects.toThrow('Invalid transaction hash');
    });
  });
});

// Integration test example
describe('Full Flow Integration Test', () => {
  test('Should handle complete top-up with cliff flow', async () => {
    const adminAddress = '0xadmin12345678901234567890123456789012345678';
    const vaultAddress = '0xvault98765432109876543210987654321098765432';
    const ownerAddress = '0xowner11111111111111111111111111111111111111';
    const tokenAddress = '0xtoken22222222222222222222222222222222222222';

    // 1. Create vault
    const vault = await vestingService.createVault(
      adminAddress,
      vaultAddress,
      ownerAddress,
      tokenAddress,
      '1000.0',
      new Date('2024-01-01'),
      new Date('2025-01-01'),
      null
    );

    // 2. Top-up with cliff
    const topUpResult = await vestingService.topUpVault(
      adminAddress,
      vaultAddress,
      '500.0',
      '0xtopup1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      86400, // 1 day cliff
      2592000 // 30 days vesting
    );

    // 3. Check vault details
    const vaultDetails = await vestingService.getVaultWithSubSchedules(vaultAddress);
    expect(vaultDetails.vault.subSchedules).toHaveLength(1);

    // 4. Calculate releasable (should be 0 during cliff)
    const duringCliff = await vestingService.calculateReleasableAmount(vaultAddress);
    expect(duringCliff.totalReleasable).toBe(0);

    expect(vault.success).toBe(true);
    expect(topUpResult.success).toBe(true);
    expect(vaultDetails.success).toBe(true);
    expect(duringCliff.success).toBe(true);
  });
});
