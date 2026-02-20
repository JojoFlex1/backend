const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SubSchedule = sequelize.define('SubSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vault_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vaults',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  top_up_amount: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
    comment: 'Amount of tokens added in this top-up',
  },
  cliff_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cliff duration in seconds for this top-up',
  },
  vesting_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total vesting duration in seconds for this top-up',
  },
  start_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When this sub-schedule starts (cliff end time)',
  },
  end_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When this sub-schedule fully vests',
  },
  amount_withdrawn: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
    defaultValue: 0,
    comment: 'Amount already withdrawn from this sub-schedule',
  },
  transaction_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Transaction hash of the top-up that created this sub-schedule',
  },
  block_number: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Block number when this sub-schedule was created',
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
  tableName: 'sub_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['vault_id'],
    },
    {
      fields: ['transaction_hash'],
      unique: true,
    },
    {
      fields: ['start_timestamp'],
    },
    {
      fields: ['end_timestamp'],
    },
  ],
});

module.exports = SubSchedule;
