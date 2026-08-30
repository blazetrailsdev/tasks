---
title: "Converge the constraint suites off the bespoke scratch database"
status: draft
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migration/unique-constraint.test.ts` and `migration/exclusion-constraint.test.ts`
run against a bespoke per-suite scratch database (`support/pg-scratch-database.ts`,
`openScratchDatabase()`), which has no Rails counterpart. Rails runs both suites
on the ordinary connection:

- `vendor/rails/activerecord/test/cases/migration/unique_constraint_test.rb:18-19`
  — `@connection = ActiveRecord::Base.lease_connection`
- `vendor/rails/activerecord/test/cases/migration/exclusion_constraint_test.rb:16-17`
  — same

Two consequences fall out of the scratch DB and were shipped with PR #7253:

1. The suites declare their own `class Section extends Base {}` /
   `class Invoice extends Base {}` and bind them with
   `(Section as unknown as { _adapter: PostgreSQLAdapter })._adapter = connection`.
   Canonical models of both names already exist
   (`test-helpers/models/section.ts`, `test-helpers/models/invoice.ts`), so the
   public `Base.adapter =` setter cannot be used: it runs `registerModelConstant`
   (`base.ts:905-912`) and would rebind those canonical names for every sibling
   file in the worker (`associations.ts:152-160`).
2. The deferred `SET CONSTRAINTS` in the two
   `added deferrable initially immediate …` cases has to be issued on the suite's
   own `connection` local instead of Rails'
   `Invoice.lease_connection.set_constraints(:deferred, "invoices_date_overlap")`
   (`exclusion_constraint_test.rb:165`) and
   `Section.lease_connection.exec_query("SET CONSTRAINTS … DEFERRED")`
   (`unique_constraint_test.rb:154`). See
   [[lease-connection-ignores-directly-bound-adapter]] for why the model receiver
   reaches the wrong session.

The canonical schema already carries both tables
(`vendor/rails/activerecord/test/schema/schema.rb:675` invoices, `:1090` sections)
and `loadPostgresqlSpecificSchema` already builds `test_unique_constraints` /
`test_exclusion_constraints` in the main test database
(`support/load-schema-helper.ts:240-242`), so the scratch DB is buying nothing the
main lane does not already have — except isolation from the fact that Rails' own
`setup`/`teardown` here drop and recreate `sections` / `invoices` outright.

## Converged shape

Both suites take `Base.leaseConnection()` as `@connection` does in Ruby, use the
canonical `Section` / `Invoice` models with no `_adapter` binding, and name the
Rails receivers at the two `SET CONSTRAINTS` call sites. That in turn requires
deciding how a suite that drops a canonical table in `teardown` coexists with
sibling files in the same worker — the reason the scratch DB was reached for. If
that cannot be resolved, `pnpm tasks block` with the specific blocker rather than
ratifying the scratch DB.

## Acceptance criteria

- Neither test file imports `pg-scratch-database.ts`; both resolve their
  connection the way Rails' `setup` does.
- No locally-declared `Section` / `Invoice` shadowing a canonical model, and no
  `_adapter` binding in either file.
- The two `added deferrable initially immediate …` cases name the Rails receiver.
- `pnpm parity:test -- --package activerecord` holds at 15/15 and 11/11 for the
  two files; all three adapter lanes stay green, run more than once to catch
  cross-file leakage.
- `openScratchDatabase` / `pg-scratch-database.ts` is deleted if these were its
  only two callers.
