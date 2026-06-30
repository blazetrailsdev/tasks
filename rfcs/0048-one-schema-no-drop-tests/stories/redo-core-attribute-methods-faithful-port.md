---
title: "Redo core/attribute-methods as faithful Rails ports (#4316)"
status: in-progress
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: 7
pr: 4331
claim: "2026-06-30T16:20:40Z"
assignee: "redo-core-attribute-methods-faithful-port"
blocked-by: null
---

## Context

**Redo of merged PR #4316** (`converge-core-attribute-methods-one-schema`,
marked done). That PR landed a _shallow_ rename of `core.test.ts` (130+/168-)
rather than a faithful Rails port — the exact failure mode RFC 0048 was
re-spec'd to prevent (2026-06-30). The merged test on `main` keeps
trails-invented names/assertions wearing canonical table names. This story
re-does it to the **Convergence contract** in the RFC 0048 README (binding).

Fidelity-only: no `AR_ONE_SCHEMA` framing (that moved to RFC
`0000-one-schema-no-drop-perf`).

## Acceptance criteria

- [ ] Each file mirrors its named Rails source **word-for-word as closely as TS
      allows**: same `describe`/`it` names, setup/fixtures, assertions. Never
      invent or reword test names (`test:compare` maps on them).
- [ ] Canonical `TEST_SCHEMA` + official models + real fixtures only; no bespoke
      tables/columns, no `_tableName` hacks.
- [ ] Impl gaps → fix the impl to match Rails or file a deviation under
      `0023-surfaced-deviations`; do not bend the test. Temporary `test:compare`
      regression acceptable (record un-skip).
- [ ] Revisit the `core.ts` + `call-mismatches-wide-exclude.json` edits #4316
      made — keep only what a faithful port justifies.

### Files → Rails source

- `packages/activerecord/src/base.test.ts` → mirror `vendor/rails/activerecord/test/cases/base_test.rb`
- `packages/activerecord/src/core.test.ts` → mirror `vendor/rails/activerecord/test/cases/core_test.rb`
- `packages/activerecord/src/core.trails.test.ts` → trails-only extension; keep unless it duplicates a Rails case
- `packages/activerecord/src/attribute-methods.test.ts` → mirror `vendor/rails/activerecord/test/cases/attribute_methods_test.rb`
- `packages/activerecord/src/attribute-methods.trails.test.ts` → trails-only extension; keep unless it duplicates a Rails case
