---
title: "converge-model-schema-coder-and-attribute-definition-names"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5924
claim: "2026-08-02T20:55:26Z"
assignee: "converge-model-schema-coder-and-attribute-definition-names"
blocked-by: null
closed-reason: null
---

## Context

Classified by `extra-surface-base-accessors-classify` as two category (c)
renames on internal helpers that `base.ts` re-declares.

**`attributeSetCoder`** — `base.ts:1598` declares
`static attributeSetCoder: typeof ModelSchema.attributeSetCoder`, implemented at
`packages/activerecord/src/model-schema.ts:788`. Rails names this
`yaml_encoder` at
`vendor/rails/activerecord/lib/active_record/model_schema.rb:446`
(`@yaml_encoder ||= ActiveModel::AttributeSet::YAMLEncoder.new(attribute_types)`;
reset at model_schema.rb:565). trails renamed it because its coder is not YAML,
and kept `yamlEncoder` as a private alias at model-schema.ts:1585 — so the tree
currently carries both spellings of one Ruby method.
Verified: `grep -rn "def attribute_set_coder" vendor/rails` returns nothing.

**`hasAttributeDefinition`** — `base.ts:1586` declares
`static hasAttributeDefinition: typeof ModelSchema.hasAttributeDefinition`,
implemented at `packages/activerecord/src/model-schema.ts:297`, whose own
docstring says it "backs the Rails-named public accessor `Base.hasAttribute`"
(Rails' `has_attribute?`, `attribute_methods.rb:256`). It is a helper split of a
method Rails writes as one.
Verified: `grep -rn "def has_attribute_definition" vendor/rails` returns nothing.

Both are `@internal` at their home in `model-schema.ts` and do not flag there;
they flag on `base.ts` because the re-declaration is public surface. Neither was
allowlisted in the classify PR — per Dean's direction on #5342, convergeable
surface stays counted.

## Acceptance criteria

- Settle `attributeSetCoder` vs `yamlEncoder`: keep exactly one spelling, and
  make it the Rails one unless the trails coder's non-YAML nature is written up
  at the call site as the justification for the rename.
- Fold `hasAttributeDefinition` into the Rails-named `hasAttribute` predicate
  (attribute_methods.rb:256) or justify the split at the call site.
- `packages/activerecord/src/base.ts` drops both names from
  `pnpm parity:api:extra --package activerecord --novel-only`; record before/after in
  the PR body.
- Re-run `pnpm parity:api:calls`.
