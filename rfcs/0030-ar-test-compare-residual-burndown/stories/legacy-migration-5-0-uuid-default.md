---
title: "Legacy Migration[5.0] uuid PK default (uuid_generate_v4) via migrator"
status: done
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 200
priority: 50
pr: 3524
claim: "2026-06-17T02:46:24Z"
assignee: "legacy-migration-5-0-uuid-default"
blocked-by: null
---

## Context

Surfaced by `e2-pg-ddl-via-exec` (RFC 0030). `ActiveRecord::Migration[5.0]`
legacy-flavor migration semantics are not implemented: the migration version
registry (`migration/compatibility.ts`) exists, but no legacy version classes
(e.g. `V5_0`) are registered, so creating an `id: :uuid` table through the
legacy migrator does not apply the legacy implicit default
(`uuid_generate_v4()` rather than the modern `gen_random_uuid()`).

Blocks two `adapters/postgresql/uuid.test.ts` tests (Rails `uuid_test.rb:296`,
`:348`): `schema dumper for uuid primary key default in legacy migration`
(`test_schema_dumper_for_uuid_primary_key_default_in_legacy_migration`) and
`schema dumper for uuid primary key with default nil in legacy migration`
(`test_schema_dumper_for_uuid_primary_key_with_default_nil_in_legacy_migration`).

The non-legacy schema-dump emission these depend on already works (see passing
`schema dumper for uuid primary key default` / `... default override via nil`);
the gap is purely the legacy migrator path. Multi-PR framework effort.

## Acceptance criteria

- [ ] Legacy `Migration[5.0]` create_table semantics applied through the
      migrator (uuid PK -> `uuid_generate_v4()` implicit default; `default: nil`
      honored).
- [ ] Un-skip the two legacy-migration uuid tests; they pass under PG.

## Resolution: won't do

Closed as **won't do** (2026-06-17). Implementing this requires porting an
`ActiveRecord::Migration::Compatibility::V5_0` shim, but legacy Rails migration
compatibility shims are deliberately **unported** by policy —
`scripts/api-compare/unported-files.ts:53-54` marks `migration/compatibility`
as _"Pre-1.0: legacy Rails version migration compatibility shims."_ The attempt
(PR #3524, which added a `V5_0` class) was closed unmerged because it
contradicted that decision.

The two `uuid_test.rb` legacy-migration tests stay skipped by that policy; they
are not a fidelity gap to converge but out-of-scope by the unported-shim
decision. If the project ever reverses the unported call for
`migration/compatibility`, re-open this work then.
