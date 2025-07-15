const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Tenant = require('./Tenant');
const Role = require('./Role');
const Permission = require('./Permission');
const UserRole = require('./UserRole');
const RolePermission = require('./RolePermission');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');
const Labour = require('./Labour');
const LabourAttendance = require('./LabourAttendance');
const Payroll = require('./Payroll');
const PayrollItem = require('./PayrollItem');
const Account = require('./Account');
const Transaction = require('./Transaction');
const JournalEntry = require('./JournalEntry');
const Asset = require('./Asset');
const AssetDepreciation = require('./AssetDepreciation');
const Scrap = require('./Scrap');
const ScrapDisposal = require('./ScrapDisposal');
const Share = require('./Share');
const ShareHolder = require('./ShareHolder');
const Dividend = require('./Dividend');
const DividendPayment = require('./DividendPayment');
const Subscription = require('./Subscription');
const SubscriptionPlan = require('./SubscriptionPlan');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const GSTFiling = require('./GSTFiling');
const AuditLog = require('./AuditLog');
const ComplianceReport = require('./ComplianceReport');

// Initialize all models
const models = {
  User: User(sequelize, DataTypes),
  Tenant: Tenant(sequelize, DataTypes),
  Role: Role(sequelize, DataTypes),
  Permission: Permission(sequelize, DataTypes),
  UserRole: UserRole(sequelize, DataTypes),
  RolePermission: RolePermission(sequelize, DataTypes),
  Project: Project(sequelize, DataTypes),
  ProjectMember: ProjectMember(sequelize, DataTypes),
  Task: Task(sequelize, DataTypes),
  Labour: Labour(sequelize, DataTypes),
  LabourAttendance: LabourAttendance(sequelize, DataTypes),
  Payroll: Payroll(sequelize, DataTypes),
  PayrollItem: PayrollItem(sequelize, DataTypes),
  Account: Account(sequelize, DataTypes),
  Transaction: Transaction(sequelize, DataTypes),
  JournalEntry: JournalEntry(sequelize, DataTypes),
  Asset: Asset(sequelize, DataTypes),
  AssetDepreciation: AssetDepreciation(sequelize, DataTypes),
  Scrap: Scrap(sequelize, DataTypes),
  ScrapDisposal: ScrapDisposal(sequelize, DataTypes),
  Share: Share(sequelize, DataTypes),
  ShareHolder: ShareHolder(sequelize, DataTypes),
  Dividend: Dividend(sequelize, DataTypes),
  DividendPayment: DividendPayment(sequelize, DataTypes),
  Subscription: Subscription(sequelize, DataTypes),
  SubscriptionPlan: SubscriptionPlan(sequelize, DataTypes),
  Invoice: Invoice(sequelize, DataTypes),
  InvoiceItem: InvoiceItem(sequelize, DataTypes),
  GSTFiling: GSTFiling(sequelize, DataTypes),
  AuditLog: AuditLog(sequelize, DataTypes),
  ComplianceReport: ComplianceReport(sequelize, DataTypes)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  ...models,
  sequelize,
  Sequelize
};