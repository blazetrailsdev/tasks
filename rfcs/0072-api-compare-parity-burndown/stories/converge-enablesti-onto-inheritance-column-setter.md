---
title: "converge-enablesti-onto-inheritance-column-setter"
status: in-progress
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5376
claim: "2026-07-26T23:58:54Z"
assignee: "converge-enablesti-onto-inheritance-column-setter"
blocked-by: null
closed-reason: null
---

## Context

Found while classifying `inheritance.ts` extra surface (#5342). `enableSti`
(`inheritance.ts:387`) is a duplicate writer for Rails' `inheritance_column`
class_attribute:

```ts
export function enableSti(modelClass: typeof Base, options: { column?: string } = {}): void {
  (modelClass as any)._inheritanceColumn = options.column ?? "type";
}
```

Rails has no `enable_sti`. STI is implicit — a model participates as soon as its
table carries the inheritance column, and the column is named by assignment:
`self.inheritance_column = 'zoink'` (model_schema.rb:146-151;
`class_attribute :inheritance_column, instance_accessor: false, default: "type"`
at model_schema.rb:172).

The faithful writer is **already ported and wired**:
`ModelSchema.inheritanceColumn` (`model-schema.ts:1472`, handles the explicit-null
arm) behind the Rails-named `Base.inheritanceColumn` setter (`base.ts:1653`). So
`enableSti(Company)` is spelled `Company.inheritanceColumn = "type"` in Rails
terms, and `enableSti(X, { column: "y" })` is `X.inheritanceColumn = "y"`.

A JS static accessor inherited from `Base` is invoked on assignment to a
subclass, and `this` binds to the subclass, so `_inheritanceColumn` still lands
as an own property — the substitution is behavior-preserving.

`enableSti` has 93 references, overwhelmingly in tests (has-many-associations.test.ts
18, eager.test.ts 10, test-helpers/models/company.ts 3, ...). It is currently
carried in `extra-surface-allow.json` rather than converged. Sized as its own
story because the mechanical migration alone is ~190 LOC.

## Acceptance criteria

- Replace every `enableSti(X)` / `enableSti(X, { column })` call with
  `X.inheritanceColumn = ...`, including test-helper models.
- Delete `enableSti` and drop it from `index.ts`'s export list.
- Remove the corresponding `extra-surface-allow.json` entry.
- Do NOT rename tests (CLAUDE.md).
- api:compare and test:compare deltas non-negative; `pnpm api:extra --package
activerecord` novel count for inheritance.ts stays 0.
- STI suites pass, plus the association suites that call `enableSti` most
  (associations/has-many-associations.test.ts, associations/eager.test.ts).
- Consider sequencing after
  [[converge-inheritance-column-reader-onto-ported-nullable]], which touches the
  reader side of the same class_attribute.
