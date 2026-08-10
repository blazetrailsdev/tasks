---
title: "Repoint ~60 stale scripts/api-compare/unported-files.ts breadcrumbs at the sharded register"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

~60 comments and doc lines across the repo point readers at
**`scripts/api-compare/unported-files.ts`** — a path that has been wrong for
some time (the register moved to `scripts/parity/` before PR #6340) and is now
doubly wrong, since #6340 replaced the single file with the directory
`scripts/parity/unported-files/`.

They are the breadcrumb every `PERMANENT-SKIP` test comment leaves for the next
reader, so a reader who follows one lands nowhere. Representative sites:

- `packages/activerecord/src/yaml-serialization.test.ts:5` and 15 siblings
  ("PERMANENT-SKIP: Ruby-only (see scripts/api-compare/unported-files.ts) — yaml")
- `packages/activerecord/src/relation/load-async.test.ts:5` and 27 siblings
- `packages/activerecord/src/adapters/{postgresql,mysql2,sqlite3}/dbconsole.test.ts`
- `packages/activerecord/src/base.ts:4280`
- `packages/activesupport/src/messages/serializer-with-fallback.ts:18`
- `packages/globalid/src/signed-global-id.ts:172`
- `packages/i18n/src/backend/transliterator.test.ts:5`
- `docs/rack-100-percent.md:149`, `docs/activesupport.md:141`,
  `docs/trailties/trailties-thor-port.md:120,134,137,155`,
  `docs/infrastructure/mixin-attribution-triage.md:64`,
  `packages/website/docs/guides/activerecord-rails-deviations.md:496`

`docs/trailties/trailties-thor-port.md` needs more than a path swap: it
instructs the reader to _append an entry to `UNPORTED_FILES` in
`scripts/api-compare/unported-files.ts`_, which no longer describes the shape
of the register. It should point at the right shard
(`unported-files/thor.ts`, a new package shard) and at
`unported-files/types.ts` for the schema.

`docs/infrastructure/rails-file-structure-mirror-plan.md:668` already links
`scripts/parity/unported-files.ts` — right directory, stale filename.

## Acceptance criteria

- [ ] Every reference to `scripts/api-compare/unported-files.ts` or
      `scripts/parity/unported-files.ts` names
      `scripts/parity/unported-files/` instead.
- [ ] `docs/trailties/trailties-thor-port.md`'s carve-out instructions describe
      the sharded register: a `thor` package shard plus `types.ts` for the
      schema, not "append to `UNPORTED_FILES`".
- [ ] Comment text is otherwise untouched — a path fix, not a rewording. No
      test name changes.
- [ ] Purely a comment/doc change: no behaviour, no parity movement.

Mostly `sed`-able, hence the small estimate; the trailties doc is the only
hand-written part.
