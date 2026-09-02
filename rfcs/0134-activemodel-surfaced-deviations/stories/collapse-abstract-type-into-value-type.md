---
title: "collapse-abstract-type-into-value-type"
status: draft
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one class, `ActiveModel::Type::Value`
(`vendor/rails/activemodel/lib/active_model/type/value.rb:9`). trails splits it
into an abstract `Type` base plus a `ValueType` subclass
(`packages/activemodel/src/type/value.ts:4`, `:136`), a deviation ratified in
`TS_ROOT_INTERMEDIATE` (`scripts/api-compare/compare.ts:2170`,
`["ValueType", "Type"]`) on the grounds that the abstract parent lets subclasses
declare `abstract cast`.

PR for `type-value-split-and-name-property-burndown` moved `type()` onto the
Rails shape (`value.rb:34-35` returns nil; every subclass overrides) and left
`equals` where Rails' `==` is (`value.rb:121-127`), so the two classes now
differ only by the abstract split itself. Collapsing them is a mechanical but
wide rename: `Type` is imported by ~68 files across activemodel, activerecord,
actionpack and arel, and is re-exported from
`activemodel/src/index.ts:78`, `activemodel/src/type.ts:4` and
`activerecord/src/type.ts:14`. That is why it was split out rather than done
in-line — see that story's "Likely needs splitting into 2-3 PRs" note.

## Acceptance criteria

- `type/value.ts` declares one class mirroring `Value`; the abstract `Type` is
  gone and every reference spells `ValueType`.
- The `["ValueType", "Type"]` row is deleted from `TS_ROOT_INTERMEDIATE`, and
  `pnpm parity:api` inheritance for activemodel does not regress.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
