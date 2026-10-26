---
title: "Generated attribute predicates are `has*`"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: ar-generated-predicates
packages: ["activemodel", "activerecord"]
deps: ["naming-shape-merge-base-gate"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruled 2026-10-26: `attribute_method_suffix "?"` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/query.rb`) generates `hasTitle` for `title?`. Today `packages/activerecord/src/attribute-methods/query.ts:17-21` registers the suffix `"?"` with pattern target `"attribute?": queryAttribute`, so a record answers `record["title?"]`, and `attribute-methods/primary-key.ts:207` lists `"id?"`. The ActiveModel pattern machinery (`packages/activemodel/src/attribute-methods.ts`) has to map the `?` suffix to a `has` prefix. The pattern target is a getter, per CLAUDE.md § "Generated attribute readers are properties". Generation skips a name the class already answers; the pattern target stays `queryAttribute`, because Rails' `attribute?` is a private alias of `query_attribute` (`query.rb:25-26`) and `hasAttribute` is already `has_attribute?`, and a column whose `has*` spelling is taken generates nothing. About 105 test reads (`record["approved?"]`, `attribute-methods.test.ts:761,901,906` `get ["title?"]`) change with it. Test names do not change.

## Acceptance criteria

- [ ] `record.hasTitle` answers what `title?` answers in Rails, and `record["title?"]` is no longer generated.
- [ ] `hasId` replaces `"id?"`.
- [ ] AR `quotedPredicate` is 1 (only `info?`).
- [ ] Tests are updated without renaming any.
