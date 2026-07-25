---
title: "internal_metadata: thread connection through private helpers per Rails"
status: claimed
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps:
  [
    "arity-skip-ruby-delegate-entries",
    "arity-collapse-required-kwargs-into-options-object",
    "arity-resolve-ts-alias-bindings-to-target-params",
  ]
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: "2026-07-25T23:18:51Z"
assignee: "arity-internal-metadata-connection-param"
blocked-by: null
closed-reason: null
---

## Context

All 5 `internal_metadata.rb` arity mismatches in
`output/arity-mismatches.json` share one root: Rails 7.2+ threads the
`connection` explicitly through InternalMetadata's private helpers, trails
dropped it:

- `update_or_create_entry(connection, key, value)` → TS `(key, value)`
- `create_entry(connection, key, value)` → TS `(key, value)`
- `update_entry(connection, key, new_value)` → TS `(key, newValue)`
- `select_entry(connection, key)` → TS `(key)`
- `current_time(connection)` → TS `()`

Rails source: `vendor/rails/activerecord/lib/active_record/internal_metadata.rb`
(private section; `pnpm rails:find update_or_create_entry` for exact lines).
TS: `packages/activerecord/src/internal-metadata.ts`. In Rails the public
surface (`[]=`, `[]`, `create_table`, …) obtains a connection via
`@pool.with_connection` and passes it down; trails presumably reaches a
connection implicitly inside each helper — that is the deviation to converge,
not just the signatures.

## Acceptance criteria

- The five TS helpers accept the leading `connection` param and the public
  callers thread it exactly as Rails does (with_connection at the public
  boundary, explicit pass-down below).
- `output/arity-mismatches.json` regenerated: all 5 `internal_metadata.rb`
  entries gone.
- Existing internal-metadata tests stay green (run the touched test files
  only); no test renames.
