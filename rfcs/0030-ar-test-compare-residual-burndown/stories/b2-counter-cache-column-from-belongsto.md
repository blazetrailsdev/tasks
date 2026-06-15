---
title: "counter-cache column derives from belongs_to"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3418
claim: "2026-06-15T22:58:27Z"
assignee: "b2-counter-cache-column-from-belongsto"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Three Rails tests are ported but
skipped in `packages/activerecord/src/scoping/default-scoping.test.ts`:
"default scope with references works through collection association",
"... through association", "... with find by"
(test*default_scope_with_references_works*\*).

Creating through a custom-named hasMany
(`PostWithCommentWithDefaultScopeReferencesAssociation#commentWithDefaultScopeReferencesAssociations`)
derives the counter-cache column from the association name
(`comment_with_default_scope_references_associations_count`) instead of the
inherited `belongs_to :post, counter_cache: true` column (`comments_count`), so
the INSERT references a non-existent column (StatementInvalid: no such column).

## Acceptance criteria

- [ ] Creating through the custom-named hasMany updates the `comments_count` counter (the belongs_to-derived column), not an association-name-derived one.
- [ ] Un-skip all three "default scope with references works ..." tests in default-scoping.test.ts; they pass on sqlite.
