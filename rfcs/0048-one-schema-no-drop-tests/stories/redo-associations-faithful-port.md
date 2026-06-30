---
title: "Redo association tests as faithful Rails ports (#4312)"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**Redo of merged PR #4312** (`converge-associations-one-schema`, marked done),
which converged only `inner-join-association.test.ts` and did so as a shallow
canonical-rename rather than a faithful Rails port — the failure mode RFC 0048
was re-spec'd to prevent (2026-06-30). This story covers the full association
test set as faithful Rails ports per the **Convergence contract** in the RFC
0048 README (binding). Supersedes the retired `converge-associations-one-schema-remainder`.

Fidelity-only; no `AR_ONE_SCHEMA` framing (moved to `0000-one-schema-no-drop-perf`).

## Acceptance criteria

- [ ] Each file mirrors its Rails source word-for-word (names, setup, fixtures,
      assertions). Never invent/reword test names.
- [ ] Canonical `TEST_SCHEMA` + official models + real fixtures only; no bespoke
      tables/columns, no `_tableName` hacks.
- [ ] Impl gaps → fix impl or file `0023-surfaced-deviations`; don't bend tests.
- [ ] Split per file under the 500-LOC ceiling (habtm ~1190 LOC, has-one-through
      ~1639 LOC will each need their own PR); all-or-nothing per file.

### Files → Rails source

- `packages/activerecord/src/associations/inner-join-association.test.ts` → mirror `vendor/rails/activerecord/test/cases/associations/inner_join_association_test.rb` (re-do #4312's shallow version)
- `packages/activerecord/src/associations/eager-singularization.test.ts` → mirror `vendor/rails/activerecord/test/cases/associations/eager_singularization_test.rb`
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` → mirror `vendor/rails/activerecord/test/cases/associations/has_and_belongs_to_many_associations_test.rb`
- `packages/activerecord/src/associations/has-one-through-associations.test.ts` → mirror `vendor/rails/activerecord/test/cases/associations/has_one_through_associations_test.rb`
