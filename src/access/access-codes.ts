export enum SystemCode {
  FINANCE = 1,
  SALES = 2,
  INVENTORY = 3,
  IAM = 90,
}

export enum ResourceCode {
  SALES_INVOICE = 1000,
  SALES_PROFORMA = 1001,
  SALES_CENTER = 1003,
}

export enum ActionCode {
  READ = 1,
  CREATE = 2,
  UPDATE = 3,
  SOFT_DELETE = 4,
  HARD_DELETE = 5,
  APPROVE = 6,
  REJECT = 7,
  CANCEL = 8,
  PRINT = 9,
  EXPORT = 10,
  SUBMIT = 11,
}
