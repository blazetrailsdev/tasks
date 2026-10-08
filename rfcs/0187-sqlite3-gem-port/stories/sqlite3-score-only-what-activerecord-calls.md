---
title: "sqlite3: the parity score counts only the gem methods activerecord calls"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: package
packages: ["scripts", "sqlite3"]
deps: ["sqlite3-retire-the-sqlite-driver-interfaces"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0187-sqlite3-gem-port § "Scoring": the `sqlite3` score's denominator is the gem methods
activerecord calls, and nothing else (owner decision, 2026-10-08). Today `pnpm parity:api` prints
`sqlite3` at 229/303 methods, files 3/7, over all of `vendor/sqlite3/v2.6.0/lib/sqlite3/`. The
missing 74 mix methods a story in this RFC ports with gem surface no Rails adapter body reaches.

What activerecord calls is the RFC's § "The surface" table, read from
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb` and
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/`. The RFC's
Non-goals name the gem surface that is out: `Backup`, `ResultSet`, `Value`, aggregates,
`define_function`, collations, `load_extension`, `transaction` / `commit`, `interrupt`,
`VersionInfo`.

The two registers are `UNPORTED_FILES` (a whole gem file) and `SCOPED_SKIP_GROUPS` in
`scripts/parity/conventions.ts` (one method in an enrolled file).

## Acceptance criteria

- [ ] Run after the Database, Statement and engine stories, so every method this RFC ports is already matched and the remaining missing rows are exactly the ones nothing will port.
- [ ] Every `lib/sqlite3/*.rb` file with no member activerecord calls is an `UNPORTED_FILES` row with the reason "not called by activerecord".
- [ ] Every remaining missing method in an enrolled file is a `SCOPED_SKIP_GROUPS` entry with the same reason. Check for an existing scoped entry before adding one.
- [ ] A method that is already ported and matched stays scored. Nothing is deleted to shrink the count.
- [ ] `pnpm parity:api` prints the `sqlite3` row with a missing count of 0; the PR body prints the row before and after.
- [ ] `sqlite3` is not added to `GATED_PACKAGES`.

## Verification

```bash
pnpm parity:api && pnpm vitest run scripts/
```
