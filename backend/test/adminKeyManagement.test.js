const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data for admin addresses
const CURRENT_ADMIN = '0x1234567890123456789012345678901234567890';
const NEW_ADMIN = '0x9876543210987654321098765432109876543210';
const INVALID_ADMIN = '0xinvalid';
const CONTRACT_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef1234';

async function testAdminKeyManagement() {
  console.log('🧪 Testing Admin Key Management Implementation\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Propose new admin (global)
    console.log('\n2. Testing propose new admin (global)...');
    const proposeResponse = await axios.post(`${BASE_URL}/api/admin/propose-new-admin`, {
      currentAdminAddress: CURRENT_ADMIN,
      newAdminAddress: NEW_ADMIN
    });
    console.log('✅ Admin proposal successful:', proposeResponse.data);
    const transferId = proposeResponse.data.data.transferId;

    // Test 3: Get pending transfers
    console.log('\n3. Testing get pending transfers...');
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/pending-transfers`);
    console.log('✅ Pending transfers retrieved:', pendingResponse.data);
    
    if (pendingResponse.data.data.total === 0) {
      throw new Error('Expected 1 pending transfer, but found 0');
    }

    // Test 4: Accept ownership
    console.log('\n4. Testing accept ownership...');
    const acceptResponse = await axios.post(`${BASE_URL}/api/admin/accept-ownership`, {
      newAdminAddress: NEW_ADMIN,
      transferId: transferId
    });
    console.log('✅ Ownership accepted successfully:', acceptResponse.data);

    // Test 5: Verify no pending transfers remain
    console.log('\n5. Testing pending transfers after acceptance...');
    const pendingAfterResponse = await axios.get(`${BASE_URL}/api/admin/pending-transfers`);
    console.log('✅ Pending transfers after acceptance:', pendingAfterResponse.data);
    
    if (pendingAfterResponse.data.data.total !== 0) {
      throw new Error('Expected 0 pending transfers after acceptance, but found ' + pendingAfterResponse.data.data.total);
    }

    // Test 6: Propose new admin for specific contract
    console.log('\n6. Testing propose new admin (contract-specific)...');
    const proposeContractResponse = await axios.post(`${BASE_URL}/api/admin/propose-new-admin`, {
      currentAdminAddress: CURRENT_ADMIN,
      newAdminAddress: NEW_ADMIN,
      contractAddress: CONTRACT_ADDRESS
    });
    console.log('✅ Contract-specific admin proposal successful:', proposeContractResponse.data);
    const contractTransferId = proposeContractResponse.data.data.transferId;

    // Test 7: Get pending transfers for specific contract
    console.log('\n7. Testing get pending transfers for specific contract...');
    const pendingContractResponse = await axios.get(`${BASE_URL}/api/admin/pending-transfers?contractAddress=${CONTRACT_ADDRESS}`);
    console.log('✅ Contract-specific pending transfers retrieved:', pendingContractResponse.data);

    // Test 8: Accept contract-specific ownership
    console.log('\n8. Testing accept ownership for contract...');
    const acceptContractResponse = await axios.post(`${BASE_URL}/api/admin/accept-ownership`, {
      newAdminAddress: NEW_ADMIN,
      transferId: contractTransferId
    });
    console.log('✅ Contract ownership accepted successfully:', acceptContractResponse.data);

    // Test 9: Test immediate transfer ownership (backward compatibility)
    console.log('\n9. Testing immediate transfer ownership...');
    const transferResponse = await axios.post(`${BASE_URL}/api/admin/transfer-ownership`, {
      currentAdminAddress: CURRENT_ADMIN,
      newAdminAddress: NEW_ADMIN,
      contractAddress: CONTRACT_ADDRESS
    });
    console.log('✅ Immediate ownership transfer successful:', transferResponse.data);

    // Test 10: Test error cases
    console.log('\n10. Testing error cases...');
    
    // Test invalid admin address
    try {
      await axios.post(`${BASE_URL}/api/admin/propose-new-admin`, {
        currentAdminAddress: INVALID_ADMIN,
        newAdminAddress: NEW_ADMIN
      });
      throw new Error('Should have failed with invalid admin address');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.log('✅ Invalid admin address properly rejected');
      } else {
        throw error;
      }
    }

    // Test same admin addresses
    try {
      await axios.post(`${BASE_URL}/api/admin/propose-new-admin`, {
        currentAdminAddress: CURRENT_ADMIN,
        newAdminAddress: CURRENT_ADMIN
      });
      throw new Error('Should have failed with same admin addresses');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.log('✅ Same admin addresses properly rejected');
      } else {
        throw error;
      }
    }

    // Test invalid transfer ID
    try {
      await axios.post(`${BASE_URL}/api/admin/accept-ownership`, {
        newAdminAddress: NEW_ADMIN,
        transferId: 'invalid-transfer-id'
      });
      throw new Error('Should have failed with invalid transfer ID');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.log('✅ Invalid transfer ID properly rejected');
      } else {
        throw error;
      }
    }

    // Test 11: Get audit logs
    console.log('\n11. Testing audit logs...');
    const auditResponse = await axios.get(`${BASE_URL}/api/admin/audit-logs`);
    console.log('✅ Audit logs retrieved:', auditResponse.data);

    console.log('\n🎉 All admin key management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAdminKeyManagement();
}

module.exports = { testAdminKeyManagement };
