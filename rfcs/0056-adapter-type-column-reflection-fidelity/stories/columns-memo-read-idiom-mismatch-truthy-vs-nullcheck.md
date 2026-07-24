---
title: "columns() reads its memo with a truthy check while columnsHash()/getColumnsHash use != null"
status: claimed
updated: 2026-07-24
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 25
pr: null
claim: "2026-07-24T13:38:24Z"
assignee: "columns-memo-read-idiom-mismatch-truthy-vs-nullcheck"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #5178.

`columns()` in `packages/activerecord/src/model-schema.ts` reads its memo with
a truthy check (`const memo = columnMemo(this, "_columns"); if (memo) return
memo;`), while `columnsHash()` and `getColumnsHash` use `!= null` on the same
`columnMemo` helper. An empty array is falsy-adjacent here only by accident:
`[]` IS truthy in JS, so the current code happens to work — but the value that
is NOT served from the memo is a legitimately empty column list, which reaches
the truthy check as `[]` and passes.

The real inconsistency is the mixed idiom across three readers of one helper:
`!= null` in two, plain truthiness in the third. `columnMemo` returns
`SchemaHost[K] | undefined`, so `!= null` is the contract-correct test; a
future change that makes an absent memo `null` rather than `undefined`, or that
returns a nullable column list, would diverge silently between the readers.

Rails has no analogue to hedge against here: `columns` is
`@columns ||= columns_hash.values.freeze`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:432-434`), where
`||=` means an empty-but-memoized `[]` is truthy and served, exactly like ours.
So this is idiom hygiene, not a behavior bug.

## Acceptance criteria

- `columns()` reads its memo with `!= null`, matching `columnsHash()` and
  `getColumnsHash`.
- No behavior change: existing STI ignoredColumns tests in base.trails.test.ts
  and base.test.ts pass unchanged.
- If `columnMemo`'s absent-memo sentinel is worth pinning, a one-line test
  asserts a subclass that ignores EVERY column memoizes and serves `[]` rather
  than recomputing.
