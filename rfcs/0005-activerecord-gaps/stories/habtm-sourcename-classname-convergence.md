---
title: "habtm-sourcename-classname-convergence"
status: ready
updated: 2026-06-27
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts` — introduced in PR #4227 (story `habtm-classname-aliased-shared-jointable-source`).

Rails' `add_right_association` always derives `rhs_name` from the **association name** via `name.to_s.singularize.to_sym` (`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:40`). Even when `class_name: "Post"` is set for an `other_posts` HABTM, Rails creates `belongs_to :other_post, class_name: "Post", foreign_key: "post_id"` on the join model. The `source_reflection_names` method then resolves via `singularize(assoc_name)` (`:other_post`) and finds it.

The trails fix in PR #4227 instead derived `sourceName` from the **class name** (yielding `"post"`), naming the join-model `belongsTo` `"post"` and setting `source: "post"` on the through has-many. This works because both the join model `belongsTo` name and the `source:` stay in sync, but it diverges from Rails' approach.

The divergence is benign today because `loadHasManyThrough` resolves the source by name from the join model's registered associations, and both names are consistent. However, any code path that assumes the source name equals `singularize(assocName)` (e.g., `source_reflection_names`'s fallback logic in reflection.ts:1109) will be inconsistent.

## Acceptance criteria

- [ ] `sourceName` in `has-and-belongs-to-many.ts` is derived from `singularize(assocName)` (matching Rails), not from `className`.
- [ ] The join model `belongsTo` is named from the association name (e.g., `otherPost`) with an explicit `foreignKey` derived from the class name (e.g., `post_id`).
- [ ] The `source:` on the generated through has-many is derived from `singularize(assocName)`, matching Rails' `source_reflection_names` fallback.
- [ ] `habtm.test.ts` and `eager.test.ts > eager with multiple associations with same table has many and habtm` still pass.
