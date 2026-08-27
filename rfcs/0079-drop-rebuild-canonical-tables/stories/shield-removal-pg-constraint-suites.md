---
title: "shield-removal-pg-constraint-suites"
status: draft
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`shield-removal-misc-singles` removed eight of its ten `rebuildCanonicalTables`
call sites (PR pending). Two are left, and they are the only ones in the list
that genuinely drop a canonical table with no intra-file way to avoid it:

- `packages/activerecord/src/migration/exclusion-constraint.test.ts:34` —
  `beforeEach:26` force-creates `invoices(start_date, end_date)`, `afterEach:32`
  drops it. `invoices` IS in Rails schema.rb (`schema.rb:675`), and Rails'
  `exclusion_constraint_test.rb:16-25` clobbers and drops it exactly the same
  way — Rails just tolerates leaving the shared schema short.
- `packages/activerecord/src/migration/unique-constraint.test.ts:26` —
  `beforeEach:19` force-creates `sections(position, null: false)`, `afterEach:24`
  drops it. `sections` is in schema.rb too (`schema.rb:1090`, inside the
  `disable_referential_integrity` block, shape
  `short_name`/`session_id`/`seminar_id`), and it is genuinely read by the
  session/seminar association suites — so leaving it dropped is not tolerable
  here the way `invoices` almost is.

Both files already construct their own `new PostgreSQLAdapter(PG_TEST_URL)`,
but `PG_TEST_URL` is the shared per-worker database, so that buys no isolation
and neither file qualifies for the `privateAdapter` group in
`eslint/require-canonical-rebuild-exclude.json`.

## Converged shape

Give these two PG-only files a database of their own — the RFC 0079 preferred
remedy ("do not drop the canonical table at all") applied by isolating the
connection rather than by renaming the table, since the table names are
schema.rb-verbatim and renaming them would be a fidelity break. Options, in
order of preference:

1. A scratch PG database per file (`CREATE DATABASE` through the primary
   connection, as `support/setup-second-pool.ts` already does for `arunit2`),
   with `invoices`/`sections` laid there. Then add both files to the
   `privateAdapter` exclude group and drop their rows from
   `eslint/rebuild-canonical-tables-callers.json`.
2. A dedicated PG schema plus `search_path`, if (1) proves too expensive per
   file.

## Acceptance criteria

- Neither file imports `rebuildCanonicalTables`; both rows are gone from
  `eslint/rebuild-canonical-tables-callers.json`.
- The PG lane stays green when these files are co-scheduled with the
  session/seminar association suites (the real `sections` consumers).
- No test renames; `parity:test` delta non-negative.
