---
title: "pg schema-statements throws six bare error classes, two of them guards Rails does not have"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
is grandfathered in `eslint/rails-error-parity-exclude.json` and throws six bare
global error classes where Rails throws ported ones. PR #7247 renamed that
exclude entry when it folded `schema-statements-class.ts` back into
`schema-statements.ts`; the rows themselves are untouched debt, now sitting at a
path that maps onto
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb`
for the first time, so each one is checkable against a Rails line.

The six sites (line numbers as of #7247):

- `:615`, `:618` — `new TypeError` in `columnNamesFromColumnNumbers`. These are
  the sharper finding: Rails' `column_names_from_column_numbers`
  (`schema_statements.rb:1152-1158`) has NO safe-integer guards at all — it
  interpolates `table_oid` and `column_numbers.join(", ")` straight into the
  SQL. The two throws are invented surface, not a mis-picked error class.
- `:1327`, `:1350`, `:1385`, `:1392` — `new Error` where the Rails counterpart
  raises a ported class.

## Converged shape

For the four `new Error` sites: find the Rails `raise` each mirrors and throw
that ported class with Rails' message string, per
`eslint/rails-error-classes.json`.

For the two `TypeError` guards: Rails has no guard, so the converged shape is to
DELETE them rather than restyle them — an invented check is invented surface
whether or not it throws a ported class. Confirm nothing relies on the throw
(the callers are `uniqueConstraints` and `foreignKeys`, which pass values read
from `pg_constraint`, never user input) before removing.

Then delete the file's row from `eslint/rails-error-parity-exclude.json` — the
list is only-shrink and a converged file must leave it.

## Acceptance criteria

- [ ] No bare `Error` / `TypeError` throw remains in
      `postgresql/schema-statements.ts`; each is either a ported Rails class at
      the Rails raise site, or deleted as a guard Rails does not have.
- [ ] The two `column_names_from_column_numbers` guards are gone, cited against
      `schema_statements.rb:1152-1158`.
- [ ] `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts`
      is removed from `eslint/rails-error-parity-exclude.json`; `pnpm lint` clean.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow; PostgreSQL
      lane green.
