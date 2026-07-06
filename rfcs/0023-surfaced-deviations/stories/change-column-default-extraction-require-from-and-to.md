---
title: "changeColumnDefault extraction must require both :from and :to (abstract + PG)"
status: in-progress
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4650
claim: "2026-07-06T00:25:40Z"
assignee: "change-column-default-extraction-require-from-and-to"
blocked-by: null
closed-reason: null
---

## Context

Rails' `extract_new_default_value` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1820`) only unwraps a Hash as a `{from, to}` changes hash when it carries **both** `:from` and `:to` keys; otherwise the value is the literal default.

Trails' `changeColumnDefault` extraction diverges — it treats an object as a changes hash on a looser condition:

- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:642` — `typeof options === "object" && options !== null && "to" in options` (checks only `to`).
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:982` (`extractNewDefaultValue`) — `"to" in defaultOrChanges` (checks only `to`).

Consequence: a bare structured default such as `change_column_default(:t, :c, { to: 1 })` without a `from` key — or any object literal default lacking `from` — is misread. The SQLite override was already tightened to require both keys in PR #4638 (`sqlite3-adapter.ts` `changeColumnDefault`), so SQLite is Rails-faithful; the abstract and PG paths are not.

## Acceptance criteria

- `changeColumnDefault` extraction in the abstract path (`schema-statements.ts:642`) and the PG `extractNewDefaultValue` (`schema-statements-class.ts:982`) only unwrap to `.to` when the value is an object with **both** `from` and `to` keys, matching Rails `extract_new_default_value`.
- A bare object/array default (no `from`/`to`) is passed through as the literal default on both paths.
- Existing `{from, to}` callers (invertible-migration, persistence, command-recorder) still behave identically.
- Consider extracting a shared `extractNewDefaultValue` helper so all three adapters share one Rails-faithful implementation instead of three copies.
