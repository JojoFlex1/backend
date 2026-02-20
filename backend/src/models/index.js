const { sequelize } = require('../database/connection');
const ClaimsHistory = require('./claimsHistory');
const Vault = require('./vault');
const SubSchedule = require('./subSchedule');
const Beneficiary = require('./beneficiary');

// Import and setup associations
require('./associations');

const models = {
  ClaimsHistory,
  Vault,
  SubSchedule,
  Beneficiary,
  sequelize,
};

// Setup associations if needed in the future
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
