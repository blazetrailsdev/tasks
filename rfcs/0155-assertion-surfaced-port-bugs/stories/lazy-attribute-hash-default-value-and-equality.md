---
title: "LazyAttributeHash#assign_default_value answers nil for an unknown name"
status: draft
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
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

`ActiveModel::LazyAttributeHash` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:94-190`)
has one remaining gap in trails' `packages/activemodel/src/attribute-set/builder.ts`:

- `assign_default_value` (`builder.rb:170-188`) returns `nil` for a name in
  neither `values` nor `types`, so `LazyAttributeHash#[]` (`builder.rb:111-113`)
  answers `nil` and `AttributeSet#[]` (`attribute_set.rb:16-18`) falls through
  to `default_attribute`. trails' `assignDefaultValue` returns
  `Attribute.null(name)` instead, and
  `builder.trails.test.ts` ("assignDefaultValue returns Attribute.null for
  unknown names") pins that deviation.

Surfaced while making `AttributeSet` read a revived `LazyAttributeHash` store
(story attribute-set-accepts-lazy-attribute-hash). The equality half this story
originally carried (`LazyAttributeHash#==`, `builder.rb:134-140`) shipped in
trails#8279.

## Acceptance criteria

- [ ] `LazyAttributeHash#assignDefaultValue` returns `undefined` for an unknown
      name, `getAttribute` is typed `Attribute | undefined`, and the trails test
      asserts the Rails answer.
