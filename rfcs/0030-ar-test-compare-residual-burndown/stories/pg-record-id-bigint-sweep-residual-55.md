---
title: "pg-record-id-bigint-sweep-residual-55"
status: claimed
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: null
claim: "2026-06-23T15:22:20Z"
assignee: "pg-record-id-bigint-sweep-residual-55"
blocked-by: null
---

## Context

Continuation of the `pg-record-id-bigint-assertion-sweep` tracking story (RFC
0030, marked done after #3597 + 6 file-group siblings), which did NOT enumerate
the full blast radius. CI run 28021658047 (PG lane, draft PR #3966 with the
bigserial flip applied) shows **55 test files** still red. After the functional
preloader/key-mismatch bug is fixed (story
`pg-bigint-pk-number-fk-association-key-match`), the residual failures are pure
`record.id` assertion churn that must be converged to tolerate BigInt:

- `expected 2 to be 2n` / `expected 1 to be 1n` (id is now BigInt)
- `expected 1n to be 1` (some assertions were over-converged the other way)
- `expected [ 3n, 4n, 1n ] to deeply equal [ 3, 4, 1 ]` (id arrays / pluck)

The original sweep siblings (batches, habtm, join-model, named-scoping,
relations, relation-with) are marked done but several of those files STILL fail
under the flip — re-audit them, do not assume covered.

Full failing-file list (CI run 28021658047, `--log-failed`):

```text
src/adapters/postgresql/foreign-table.test.ts
src/adapter.test.ts
src/associations/association-relation.test.ts
src/associations/belongs-to-associations.test.ts
src/associations/cascaded-eager-loading.test.ts
src/associations/collection-proxy.test.ts
src/associations/constructor-form-and-hmt-insert.test.ts
src/associations/disable-joins-association-scope.test.ts
src/associations/disable-joins-composite-key.test.ts
src/associations/disable-joins-nested-through.test.ts
src/associations/eager-load-includes-full-sti-class.test.ts
src/associations/eager-load-nested-include.test.ts
src/associations/eager.test.ts
src/associations/has-and-belongs-to-many-associations.test.ts
src/associations/has-many-associations.test.ts
src/associations/has-many-through-associations.test.ts
src/associations/has-many-through-disable-joins-associations.test.ts
src/associations/has-one-associations.test.ts
src/associations/has-one-through-associations.test.ts
src/associations/inverse-associations.test.ts
src/associations/join-model.test.ts
src/associations/nested-through-advanced.test.ts
src/associations/nested-through-associations.test.ts
src/associations/nested-through-preloader.test.ts
src/associations/polymorphic-sti-through.test.ts
src/associations/sti-owner-through-foreign-key.test.ts
src/associations.test.ts
src/associations/through-association-scope.test.ts
src/attribute-methods.test.ts
src/autosave.test.ts
src/base.test.ts
src/bind-parameter.test.ts
src/calculations.test.ts
src/dup.test.ts
src/insert-all.test.ts
src/json-serialization.test.ts
src/locking.test.ts
src/nested-attributes.test.ts
src/null-relation.test.ts
src/persistence.test.ts
src/primary-keys.test.ts
src/query-cache.test.ts
src/reflection.test.ts
src/relation/delegation.test.ts
src/relation/field-ordered-values.test.ts
src/relation/select.test.ts
src/relations.test.ts
src/relation/where.test.ts
src/reserved-word.test.ts
src/scoping/default-scoping.test.ts
src/scoping/named-scoping.test.ts
src/scoping/relation-scoping.test.ts
src/strict-loading.test.ts
src/test-helpers/use-fixtures.test.ts
src/view.test.ts
```

Converge each `expect(record.id).toBe(<number>)` / id-arithmetic to be green on
BOTH the current serial lane AND the bigserial lane (e.g. `Number(record.id)`
where a numeric compare is intended, or assert the BigInt form). Group by test
file, each PR <300 LOC.

## Acceptance criteria

- [ ] Every `record.id` assertion / id-arithmetic in the 55 listed files is green
      on both serial and bigint PG lanes. Test names stay verbatim.
- [ ] Land all sweep PRs BEFORE `pg-bigserial-createtable-dumper-flip` (#3966).
- [ ] Do NOT fan out PRs from one agent — file per-file-group sibling stories.

## Notes

Prerequisite for `pg-bigserial-createtable-dumper-flip`. Depends on the
functional key-match fix landing first, else the `[] length`/`null` failures
mask the assertion-only ones.
