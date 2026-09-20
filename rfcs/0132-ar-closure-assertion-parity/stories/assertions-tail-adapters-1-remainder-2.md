---
title: "assertions-tail-adapters-1-remainder-2"
status: claimed
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-20T00:58:44Z"
assignee: "assertions-activemodel-errors-cluster"
blocked-by: null
closed-reason: null
---

## Context

The tail of `assertions-tail-adapters-1-remainder` (RFC 0132). That story listed
eight files; trails#7897 converged the one that is runnable in the local vitest
project — `connection_adapters/schema_cache_test.rb`, now at 0 count/kind/value
mismatches — and hit the 700 LOC ceiling with it alone. These seven are what is
left.

Every one of them lives in a PG or MySQL test directory that the local vitest
project excludes (`adapters/postgresql/**`, `adapters/mysql2/**`,
`adapters/abstract_mysql_adapter/**`), or needs a second pool with a real
server, so verifying a converged body needs a PG/MySQL environment or a CI run.
Re-measured with `pnpm parity:test -- --package activerecord --assertions
--missing` at trails#7897:

| Rails file                                                 | count | kind | value |
| ---------------------------------------------------------- | ----- | ---- | ----- |
| `adapters/postgresql/uuid_test.rb`                         | 13    | 16   | 0     |
| `connection_adapters/connection_handler_test.rb`           | ~     | ~    | 0     |
| `adapters/postgresql/enum_test.rb`                         | 7     | 11   | 6     |
| `adapters/mysql2/mysql2_adapter_test.rb`                   | 8     | 14   | 0     |
| `connection_adapters/connection_handlers_multi_db_test.rb` | ~     | ~    | 3     |
| `adapters/postgresql/bytea_test.rb`                        | 7     | 10   | 0     |
| `adapters/abstract_mysql_adapter/connection_test.rb`       | 6     | 10   | 0     |

Two leads carried over from the parent story, both still true:

- `uuid_test.rb`'s trails bodies build bespoke `CREATE TABLE`s. The canonical
  `uuid_data_type` / `uuid_type` tables are in
  `vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb`, with
  the `UUIDType` model beside them — use those, per CLAUDE.md's
  "canonical tables only".
- `enum_test.rb`'s six value mismatches are `assert_includes` arms over the
  schema dump: the trails bodies assert trails' own emitted spelling
  (`await ctx.createEnum("mood", ["sad","ok","happy"])`) where Rails asserts
  `create_enum "mood", ["sad", "ok", "happy"]`. Check which side is wrong —
  the dumper's output may be the divergence, not the assertion.

This is more than one PR: 700 LOC will not cover seven files. Split it by
adapter lane (postgresql / mysql / connection_adapters) with non-overlapping
files, one PR each from `main`, and file the splits as their own stories rather
than fanning out PRs.

## Acceptance criteria

- Each of the seven files reports 0 count/kind/value mismatches under
  `pnpm parity:test -- --package activerecord --assertions --missing`.
- Bodies are ports of the Rails bodies, not re-inventions: the Rails locals,
  branch order, and helper decomposition, and the canonical schema/models/
  fixtures rather than bespoke `CREATE TABLE`s.
- Converged bodies that fail are parked `it.skip` with a `BLOCKED: <story-id>`
  naming a filed story, per the RFC 0132 procedure — never renamed, never
  reworded.
- `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` and
  `parity:api:params` stay green; `parity:api` / `parity:test` deltas
  non-negative.
