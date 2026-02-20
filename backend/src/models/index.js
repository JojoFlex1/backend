const { sequelize } = require('../database/connection');
const ClaimsHistory = require('./claimsHistory');
const Vault = require('./vault');
const SubSchedule = require('./subSchedule');

// Setup associations
Vault.hasMany(SubSchedule, {
  foreignKey: 'vault_id',
  as: 'subSchedules',
  onDelete: 'CASCADE',
});

SubSchedule.belongsTo(Vault, {
  foreignKey: 'vault_id',
  as: 'vault',
});

const models = {
  ClaimsHistory,
  Vault,
  SubSchedule,
  sequelize,
};

// Setup associations if needed in the future
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
