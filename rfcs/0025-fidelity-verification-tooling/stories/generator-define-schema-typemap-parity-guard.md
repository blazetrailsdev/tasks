---
title: "Guard: schema-file-generator type maps must match define-schema.ts COLUMN_TYPE_MAP_*"
status: in-progress
updated: 2026-07-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4464
claim: "2026-07-03T02:33:53Z"
assignee: "generator-define-schema-typemap-parity-guard"
blocked-by: null
closed-reason: null
---

## Context

PR #4461 fixed a MariaDB-only regression where the boot-laid canonical `topics.last_read` was created as `varchar(255)` instead of `date`, so `readAttribute` returned a raw string instead of a `Temporal.PlainDate` (`base.test.ts > "preserving date objects"`).

Root cause: `packages/activerecord/src/test-helpers/schema-file-generator.ts` carried its own `SCHEMA_TO_AR_MYSQL` map that remapped `date`/`time`/`json` → `string`. That was a hand-copied mirror of `define-schema.ts` `COLUMN_TYPE_MAP_MYSQL` (test-helpers/define-schema.ts:309-322) from _before_ PR #4141 converged those columns to native MySQL types. `define-schema.ts` was fixed; the generator's copy was not, and the drift went silently undetected until RFC 0059 Phase 2 (#4455) moved models onto the boot generator path.

The generator (`SCHEMA_TO_AR`, `serialIdType`, datetime-precision:6 injection, index length/expression gating) is a parallel re-implementation of `define-schema.ts`'s per-adapter type/option mapping. Any future edit to one that isn't mirrored in the other reintroduces the same class of silent divergence.

## Acceptance criteria

- Add a guard (unit test or lint) asserting `schema-file-generator.ts`'s emitted column types for a representative schema agree with `define-schema.ts`'s `COLUMN_TYPE_MAP_MYSQL` / `COLUMN_TYPE_MAP_PG` / `COLUMN_TYPE_MAP_SQLITE` for every `PrimitiveColumnSpec` on each adapter, so a future one-sided edit fails CI.
- Cover the datetime `precision:6` MySQL injection and the serial-PK width rule (`serialIdType`) if cheaply expressible; otherwise scope to the primitive type map and note the residual.
- Reference PR #4461 and #4141 in the guard's comment as the drift that motivated it.
