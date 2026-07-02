---
title: "force path should still run assertCanonicalSchema (skip only the no-op return)"
status: ready
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under `AR_ONE_SCHEMA=1`, `defineSchema(..., { force: true })` short-circuits
BEFORE `assertCanonicalSchema` runs (`define-schema.ts:613` —
`process.env.AR_ONE_SCHEMA === "1" && !resolvedOpts?.force`). So the `force`
path issues real DDL but never validates the requested schema against canonical
`TEST_SCHEMA`.

PR #4430 (converge-secondary-pool-schema-layout-one-schema) added two
test-facing `force` sites that lay canonical tables into SECONDARY adapters/pools
the one-schema boot never reaches:

- `test-helpers/setup-second-pool.ts` — `ARUNIT2_SCHEMA` on the `arunit2` pool.
- `transaction-instrumentation.test.ts` — `canonicalSchema.topics` on an
  isolated `:memory:` adapter.

Both are provably canonical today (verbatim subset / by-reference), so no live
bug. But those files were removed from `eslint/one-schema-exclude.json`
specifically to bring them under one-schema enforcement, and `force` quietly
opts them back OUT of the very `assertCanonicalSchema` check that enforcement is
for. A future edit to `ARUNIT2_SCHEMA` that diverges from canonical
`colleges`/`courses`/`professors`/`courses_professors` would not be caught.

## Acceptance criteria

- Split the `force` semantics so it suppresses only the one-schema no-op DDL
  RETURN, not the canonical conformance assertion: run `assertCanonicalSchema`
  on the `force` path too, then fall through to real DDL.
- Verify existing `force` callers stay green: boot builders / template setup
  pass the full canonical `TEST_SCHEMA`, and `repairWorkerSchema` passes a
  single canonical table — both already conformant.
- Drop the now-redundant "force bypasses assertCanonicalSchema" caveat comments
  in `setup-second-pool.ts` and `transaction-instrumentation.test.ts`.
- No test renames; no bespoke tables.
