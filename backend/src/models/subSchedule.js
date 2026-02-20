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
    comment: 'Reference to the parent vault',
  },
  top_up_amount: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
    comment: 'Amount of tokens added in this top-up',
  },
  top_up_transaction_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Transaction hash of the top-up',
  },
  top_up_timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the top-up occurred',
  },
  cliff_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Cliff duration in seconds for this top-up (null = no cliff)',
  },
  cliff_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the cliff for this top-up ends (calculated from cliff_duration)',
  },
  vesting_start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When vesting starts for this top-up (could be immediate or after cliff)',
  },
  vesting_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Vesting duration in seconds for this top-up',
  },
  amount_released: {
    type: DataTypes.DECIMAL(36, 18),
    allowNull: false,
    defaultValue: 0,
    comment: 'Amount of tokens already released from this sub-schedule',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this sub-schedule is active',
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
      fields: ['top_up_transaction_hash'],
      unique: true,
    },
    {
      fields: ['top_up_timestamp'],
    },
    {
      fields: ['cliff_date'],
    },
    {
      fields: ['is_active'],
    },
  ],
});

module.exports = SubSchedule;
