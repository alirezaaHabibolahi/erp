# Sales Invoice Flow

This document describes the target sales invoice flow for the ERP.

## System

```text
2 = SALES
```

## Main Resources

```text
customer
pre_invoice
pre_invoice_item
invoice
invoice_item
payment
```

## Business Purpose

The sales system manages the customer sales process:

```text
Customer
  -> Pre-invoice
  -> Approval
  -> Invoice
  -> Tax or official submission
  -> Payment tracking
  -> Accounting/inventory integration
```

## Pre-Invoice Lifecycle

```text
draft
  -> pending_approval
  -> approved
  -> converted

draft
  -> cancelled

pending_approval
  -> rejected

approved
  -> cancelled
```

Status meanings:

| Status           | Meaning                       |
| ---------------- | ----------------------------- |
| draft            | Created but not submitted     |
| pending_approval | Waiting for manager approval  |
| approved         | Approved and ready to convert |
| rejected         | Approval rejected             |
| converted        | Converted to invoice          |
| cancelled        | Cancelled before conversion   |

## Invoice Lifecycle

```text
draft
  -> issued
  -> sent_to_tax
  -> partially_paid
  -> paid

issued
  -> cancelled

draft
  -> void
```

Status meanings:

| Status         | Meaning                         |
| -------------- | ------------------------------- |
| draft          | Invoice exists but not issued   |
| issued         | Official invoice issued         |
| sent_to_tax    | Sent to tax system              |
| partially_paid | Some payment received           |
| paid           | Fully paid                      |
| cancelled      | Cancelled with business reason  |
| void           | Voided before becoming official |

## Core Business Rules

- Pre-invoice number must be unique per company.
- Invoice number must be unique per company.
- Deleted customers cannot be used in new invoices.
- Draft pre-invoices can be edited.
- Pending pre-invoices require approval or rejection.
- Approved pre-invoices can be converted to invoices.
- Converted pre-invoices cannot be edited.
- Invoice totals must be calculated from items.
- Manual total override should require a special permission.
- Hard delete should be blocked unless user has the `HARD_DELETE` action for
  the invoice resource.
- Every approval, cancellation, and hard delete must be audited.

## Permissions

### Customer

```text
SALES_CUSTOMER.READ
SALES_CUSTOMER.CREATE
SALES_CUSTOMER.UPDATE
SALES_CUSTOMER.SOFT_DELETE
SALES_CUSTOMER.HARD_DELETE
SALES_CUSTOMER.EXPORT
```

### Pre-Invoice

```text
2.1001.1 = SALES_PROFORMA.READ
2.1001.2 = SALES_PROFORMA.CREATE
2.1001.3 = SALES_PROFORMA.UPDATE
2.1001.4 = SALES_PROFORMA.SOFT_DELETE
2.1001.5 = SALES_PROFORMA.HARD_DELETE
2.1001.11 = SALES_PROFORMA.SUBMIT
2.1001.6 = SALES_PROFORMA.APPROVE
2.1001.7 = SALES_PROFORMA.REJECT
2.1001.8 = SALES_PROFORMA.CANCEL
SALES_PROFORMA.CONVERT_TO_INVOICE
2.1001.10 = SALES_PROFORMA.EXPORT
2.1001.9 = SALES_PROFORMA.PRINT
```

### Invoice

```text
2.1000.1 = SALES_INVOICE.READ
2.1000.2 = SALES_INVOICE.CREATE
2.1000.3 = SALES_INVOICE.UPDATE
2.1000.4 = SALES_INVOICE.SOFT_DELETE
2.1000.5 = SALES_INVOICE.HARD_DELETE
2.1000.6 = SALES_INVOICE.APPROVE
2.1000.8 = SALES_INVOICE.CANCEL
SALES_INVOICE.VOID
SALES_INVOICE.SEND_TO_TAX
2.1000.10 = SALES_INVOICE.EXPORT
2.1000.9 = SALES_INVOICE.PRINT
```

## Scope Examples

Sales operator:

```text
permission: 2.1000.1 = SALES_INVOICE.READ
scope: OWN
```

Branch manager:

```text
permission: 2.1000.6 = SALES_INVOICE.APPROVE
scope: BRANCH
condition:
  maxAmount: 500000000
```

Company finance manager:

```text
permission: 2.1000.1 = SALES_INVOICE.READ
scope: COMPANY
```

System admin:

```text
permission: 2.1000.5 = SALES_INVOICE.HARD_DELETE
scope: ALL
```

## Target Tables

### customers

See [Target PostgreSQL and Prisma Schema](../database/02-target-postgresql-prisma-schema.md#customers).

### pre_invoices

Important fields:

```text
id
company_id
branch_id
customer_id
number
status
issue_date
valid_until
subtotal
discount_total
tax_total
grand_total
currency
notes
created_by_id
approved_by_id
approved_at
converted_invoice_id
version
created_at
updated_at
deleted_at
```

### pre_invoice_items

Important fields:

```text
id
pre_invoice_id
product_id
description
quantity
unit_price
discount_amount
tax_rate
tax_amount
line_total
sort_order
```

### invoices

Important fields:

```text
id
company_id
branch_id
customer_id
pre_invoice_id
number
status
issue_date
due_date
subtotal
discount_total
tax_total
grand_total
paid_total
currency
tax_tracking_code
notes
created_by_id
approved_by_id
approved_at
version
created_at
updated_at
deleted_at
```

### invoice_items

Important fields:

```text
id
invoice_id
product_id
description
quantity
unit_price
discount_amount
tax_rate
tax_amount
line_total
sort_order
```

## API Endpoints

### Customers

```text
GET    /sales/customers
GET    /sales/customers/:id
POST   /sales/customers
PUT    /sales/customers/:id
DELETE /sales/customers/:id
DELETE /sales/customers/:id/hard
```

### Pre-Invoices

```text
GET    /sales/pre-invoices
GET    /sales/pre-invoices/:id
POST   /sales/pre-invoices
PUT    /sales/pre-invoices/:id
DELETE /sales/pre-invoices/:id
POST   /sales/pre-invoices/:id/submit
POST   /sales/pre-invoices/:id/approve
POST   /sales/pre-invoices/:id/reject
POST   /sales/pre-invoices/:id/cancel
POST   /sales/pre-invoices/:id/convert-to-invoice
GET    /sales/pre-invoices/:id/print
```

### Invoices

```text
GET    /sales/invoices
GET    /sales/invoices/:id
POST   /sales/invoices
PUT    /sales/invoices/:id
DELETE /sales/invoices/:id
DELETE /sales/invoices/:id/hard
POST   /sales/invoices/:id/approve
POST   /sales/invoices/:id/cancel
POST   /sales/invoices/:id/void
POST   /sales/invoices/:id/send-to-tax
GET    /sales/invoices/:id/print
GET    /sales/invoices/export
```

## Create Pre-Invoice Flow

```text
request
  -> validate customer
  -> check 2.1001.2 = SALES_PROFORMA.CREATE
  -> validate items
  -> calculate totals
  -> generate number
  -> create pre_invoice and items in transaction
  -> audit sales.pre_invoice.created
  -> return response
```

## Approve Pre-Invoice Flow

```text
request
  -> check 2.1001.6 = SALES_PROFORMA.APPROVE
  -> load pre_invoice
  -> verify status is pending_approval
  -> evaluate scope and conditions
  -> set status approved
  -> set approved_by_id and approved_at
  -> audit sales.pre_invoice.approved
  -> return response
```

## Convert Pre-Invoice To Invoice Flow

```text
request
  -> check SALES_PROFORMA.CONVERT_TO_INVOICE
  -> load approved pre_invoice with items
  -> create invoice and invoice_items in transaction
  -> set pre_invoice status converted
  -> link converted_invoice_id
  -> audit sales.pre_invoice.converted
  -> audit sales.invoice.created
  -> return invoice
```

## Inventory Integration

Invoice issue may reserve or reduce stock depending on business settings.

Possible strategies:

```text
reserve_on_pre_invoice
reserve_on_invoice_issue
reduce_on_invoice_issue
reduce_on_delivery
```

The selected strategy must be stored in company or sales settings.

## Accounting Integration

When invoice status becomes `issued`, the system may create accounting entries:

```text
debit: accounts_receivable
credit: sales_revenue
credit: vat_payable
```

This should be implemented only after accounting module foundations exist.

## Audit Events

```text
sales.customer.created
sales.customer.updated
sales.customer.deleted
sales.pre_invoice.created
sales.pre_invoice.updated
sales.pre_invoice.submitted
sales.pre_invoice.approved
sales.pre_invoice.rejected
sales.pre_invoice.cancelled
sales.pre_invoice.converted
sales.invoice.created
sales.invoice.updated
sales.invoice.approved
sales.invoice.cancelled
sales.invoice.voided
sales.invoice.sent_to_tax
sales.invoice.deleted
sales.invoice.hard_deleted
sales.invoice.exported
```
