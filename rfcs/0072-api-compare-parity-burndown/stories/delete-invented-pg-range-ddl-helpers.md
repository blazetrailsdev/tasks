---
title: "delete-invented-pg-range-ddl-helpers"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

Found by the `@noRailsEquivalent` tag audit (RFC 0080).
`connection-adapters/postgresql-adapter.ts:4301` (`createRange`) and `:4318`
(`dropRange`) are tagged as having no Rails equivalent. That is true and it is
the problem: Rails has no range-type DDL helper anywhere. A grep of
`vendor/rails/activerecord/lib/active_record` for range DDL finds nothing; the
only type-DDL helpers Rails ships are the enum quartet
(`postgresql_adapter.rb:541` `create_enum`, `:571` `drop_enum`, plus
`rename_enum`/`rename_enum_value`), stubbed on the base at
`abstract_adapter.rb:576-580`.

This is not a TypeScript limitation and not unfinished porting. It is an
invented feature modelled on Rails' enum helpers. Under the repo's
fidelity-first rule, invented public API is deleted rather than excused, and a
tag on it moves the excuse from JSON to JSDoc without doing the work.

## Acceptance criteria

- Decide, and record the decision explicitly: delete `createRange` /
  `dropRange` (fidelity-first default) or keep them with a reason that states
  a concrete trails requirement Rails does not have.
- If deleted: remove the accessors, their implementations in
  `connection-adapters/postgresql/schema-statements-class.ts`, their
  `@noRailsEquivalent` tags, and move any caller onto a raw
  `execute("CREATE TYPE … AS RANGE")` the way Rails does.
- Any test that exercised the helpers is rewritten against the raw execute,
  without renaming the test.
- `pnpm api:extra --package activerecord` reports no stale tags.
