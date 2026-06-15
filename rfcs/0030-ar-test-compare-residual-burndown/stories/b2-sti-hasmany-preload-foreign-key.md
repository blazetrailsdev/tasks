---
title: "STI hasMany eager/preload foreign key derivation"
status: claimed
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-06-15T23:16:27Z"
assignee: "b2-sti-hasmany-preload-foreign-key"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Rails
`test_sti_association_with_unscoped_not_affected_by_default_scope` is ported with
the faithful body but skipped in
`packages/activerecord/src/scoping/default-scoping.test.ts`
("sti association with unscoped not affected by default scope").

`eager_load`/`includes`/`preload` of the STI `specialComments` hasMany on `Post`
builds the wrong foreign key — it emits `comments.special_post_id` instead of
`comments.post_id` — so the query raises `SqliteError: no such column:
comments.special_post_id`. The plain `joins(:special_comments)` path works; only
the eager/preload reflection FK derivation is wrong for the STI hasMany.

## Acceptance criteria

- [ ] `Post.eagerLoad/includes/preload("specialComments")` resolves the `post_id` foreign key on the `comments` table.
- [ ] Un-skip "sti association with unscoped not affected by default scope" in default-scoping.test.ts; the full faithful body passes on sqlite.
