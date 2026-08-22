---
title: "wave-5c-migration-shard-sweep"
status: in-progress
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6876
claim: "2026-08-22T19:49:59Z"
assignee: "wave-5c-migration-shard-sweep"
blocked-by: null
closed-reason: null
---

## Context

RFC 0106's exit condition is 0 rows with `kind: "set"` under
`scripts/api-compare/call-mismatches-exclude/**` for `activerecord`, `arel` and
`activesupport`.

`wave-5b-head-sweep` disposed of two of the three head shards it scoped —
`activerecord/schema-dumper.json` (17 rows) and
`activerecord/relation/query-methods.json` (14 rows), both migrated to
`@missingRailsCall` tags at the call site. The third,
`scripts/api-compare/call-mismatches-exclude/activerecord/migration.json`
(13 rows), did not fit the 700 LOC PR ceiling: at ~13 LOC of net churn per
migrated row, the two shards already landed at ~535 LOC.

The 13 remaining rows, by `rubyName | call`:

    call                     | build_watcher
    call                     | execute
    change_table             | compatible_table_definition
    copy                     | call
    create_join_table        | compatible_table_definition
    create_table             | compatible_table_definition
    current_environment      | call
    drop_table               | compatible_table_definition
    env                      | call
    migrate                  | with_connection
    needs_migration?         | size
    parse_migration_filename | first
    validate                 | find

Several are Ruby-idiom rows that migrate as PERMANENT (`Array#size` →
`.length`, `Array#first` → `[0]`, `Proc#call` → a direct JS call). The four
`compatible_table_definition` rows cite the `Migration[x.y]` version-compat
wrappers (`activerecord/lib/active_record/migration.rb:580-609`), which are
out of scope for trails; `build_watcher` / `execute` cite the
`FileUpdateChecker` hop (`migration.rb:658,675-680`).

Procedure is the settled one from `wave-5-head-sweep`: refresh the artifact
with `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls`, converge each
row against the Rails body it cites where it is a real divergence, and migrate
only reviewed, per-site, Rails-anchored reasons with
`pnpm parity:api:build --package activerecord --file migration.ts`. Each
migrated tag must open its reason with `PERMANENT` or `CONVERGEABLE` (naming
its story) — the extractor errors otherwise.

## Acceptance criteria

- [ ] Every row in `activerecord/migration.json` is converged, or leaves as a
      `@missingRailsCall` tag carrying its reviewed per-site reason at the call
      site.
- [ ] The shard is deleted, not committed as `[]`;
      `pnpm parity:api:calls:tighten activerecord/migration.json` if the mark
      goes stale.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
