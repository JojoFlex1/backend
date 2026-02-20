const auditLogger = require('./auditLogger');

class AdminService {
  async revokeAccess(adminAddress, targetVault, reason = '') {
    try {
      // Validate admin address (in real implementation, this would check against admin list)
      if (!this.isValidAddress(adminAddress)) {
        throw new Error('Invalid admin address');
      }

      // Validate target vault
      if (!this.isValidAddress(targetVault)) {
        throw new Error('Invalid target vault address');
      }

      // Perform revoke action (placeholder for actual implementation)
      console.log(`Revoking access to vault ${targetVault} by admin ${adminAddress}. Reason: ${reason}`);

      // Log the action for audit
      auditLogger.logAction(adminAddress, 'REVOKE', targetVault);

      return {
        success: true,
        message: 'Access revoked successfully',
        adminAddress,
        targetVault,
        action: 'REVOKE',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in revokeAccess:', error);
      throw error;
    }
  }

  async createVault(adminAddress, targetVault, vaultConfig = {}) {
    try {
      // Validate admin address
      if (!this.isValidAddress(adminAddress)) {
        throw new Error('Invalid admin address');
      }

      // Validate target vault address
      if (!this.isValidAddress(targetVault)) {
        throw new Error('Invalid target vault address');
      }

      // Perform create action (placeholder for actual implementation)
      console.log(`Creating vault ${targetVault} by admin ${adminAddress}`, vaultConfig);

      // Log the action for audit
      auditLogger.logAction(adminAddress, 'CREATE', targetVault);

      return {
        success: true,
        message: 'Vault created successfully',
        adminAddress,
        targetVault,
        action: 'CREATE',
        vaultConfig,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in createVault:', error);
      throw error;
    }
  }

  async transferVault(adminAddress, targetVault, newOwner) {
    try {
      // Validate admin address
      if (!this.isValidAddress(adminAddress)) {
        throw new Error('Invalid admin address');
      }

      // Validate target vault and new owner
      if (!this.isValidAddress(targetVault) || !this.isValidAddress(newOwner)) {
        throw new Error('Invalid target vault or new owner address');
      }

      // Perform transfer action (placeholder for actual implementation)
      console.log(`Transferring vault ${targetVault} to ${newOwner} by admin ${adminAddress}`);

      // Log the action for audit
      auditLogger.logAction(adminAddress, 'TRANSFER', targetVault);

      return {
        success: true,
        message: 'Vault transferred successfully',
        adminAddress,
        targetVault,
        action: 'TRANSFER',
        newOwner,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in transferVault:', error);
      throw error;
    }
  }

  getAuditLogs(limit = 100) {
    try {
      const logs = auditLogger.getLogEntries();
      return {
        success: true,
        logs: logs.slice(0, limit),
        total: logs.length
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Helper function to validate Ethereum addresses
  isValidAddress(address) {
    return typeof address === 'string' && 
           address.startsWith('0x') && 
           address.length === 42 &&
           /^[0-9a-fA-F]+$/.test(address.slice(2));
  }
}

module.exports = new AdminService();
