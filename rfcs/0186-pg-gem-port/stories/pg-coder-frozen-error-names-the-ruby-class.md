---
title: "pg: a frozen coder's FrozenError names PG::TextEncoder::Array"
status: draft
updated: 2026-11-19
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps:
  - pg-array-coders-move-to-the-package
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10327 made the pg coder writers raise `FrozenError` as `rb_check_frozen` does (`vendor/pg/v1.5.9/ext/pg_coder.c:342,375,405,440`). Ruby's message is `can't modify frozen PG::TextEncoder::Array: #<...>`. The trails message reads `can't modify frozen Array: ...`, because `rbObjClassname` finds no class-path row for `PG.TextEncoder.Array`, which lives in `packages/activerecord/lib/pg/text-encoder/array.ts` and is seated in `lib/pg/pg.ts` as a plain object property. The class-path tables (`pnpm parity:class-paths`) only cover the `pg` api-compare package, and that package does not see activerecord's `lib/pg`.

The test `packages/activerecord/test/cases/connection-adapters/postgresql/oid/array-encode.trails.test.ts` ("PG coder writers on a frozen coder") asserts only `/^can't modify frozen \S+: #<.*>$/`.

## Acceptance criteria

- `rbObjClassname(new PG.TextEncoder.Array(...))` is `PG::TextEncoder::Array`, and likewise for `PG::TextDecoder::Array`, through the generated class-path table (lands with `pg-array-coders-move-to-the-package`).
- The frozen-coder test asserts `/^can't modify frozen PG::TextEncoder::Array: /`.
