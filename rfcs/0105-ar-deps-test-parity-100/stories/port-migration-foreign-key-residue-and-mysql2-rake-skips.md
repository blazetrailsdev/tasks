---
title: "Close migration/foreign_key_test.rb's last case and the six mysql2 rake skips"
status: in-progress
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 7252
claim: "2026-08-30T16:38:42Z"
assignee: "port-migration-foreign-key-residue-and-mysql2-rake-skips"
blocked-by: null
closed-reason: null
---

## Context

The tail of ActiveRecord's name gap after the migration porting stories: one
missing case in
`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb`, and six
`it.skip` stubs in the trails counterpart of
`vendor/rails/activerecord/test/cases/adapters/mysql2/mysql2_rake_test.rb` —
the only skipped tests activerecord carries (`skipped = 6` in the 2026-08-13
run; every other AR file is at 0).

Skips are not passes: `scripts/test-compare/compare.ts:894-895` subtracts
`matchedSkipped` from the numerator, so these six count against 100% exactly as
a missing test does. Each stub is either a real port (the mysql rake tasks
exist: `packages/activerecord/src/tasks/`) or a case that genuinely cannot run
in the trails harness, in which case it becomes a case-level `tests:` exclusion
with a specific reason — never a stub left in place.

## Acceptance criteria

- The `foreign_key_test.rb` case is ported with its Rails name verbatim.
- Each of the six mysql2 rake skips is resolved: ported and passing on the MySQL
  lane, or converted to a case-level `tests:` registry exclusion whose reason
  names the specific blocker (a Ruby-only rake/PTY dependency, not "hard").
- `pnpm parity:test -- --package activerecord` reports `skipped = 0`.
