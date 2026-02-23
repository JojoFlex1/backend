const { sequelize } = require('../database/connection');

const ClaimsHistory = require('./claimsHistory');
const Vault = require('./vault');
const SubSchedule = require('./subSchedule');
const TVL = require('./tvl');
const Beneficiary = require('./beneficiary');
const Organization = require('./organization');
const { Token, initTokenModel } = require('./token');


initTokenModel(sequelize);

const models = {
  ClaimsHistory,
  Vault,
  SubSchedule,
  TVL,
  Beneficiary,
  Organization,
  Token,
  sequelize,
};

// Setup associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
