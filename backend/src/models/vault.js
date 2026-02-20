const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Vault = sequelize.define('Vault', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Smart contract address of the vault',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable name for the vault',
  },
  token_address: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Address of the token being vested',
  },
  owner_address: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Address of the vault owner',
  },
  total_amount: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total tokens deposited in the vault',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'vaults',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['address'],
      unique: true,
    },
    {
      fields: ['owner_address'],
    },
    {
      fields: ['token_address'],
    },
  ],
});

module.exports = Vault;
