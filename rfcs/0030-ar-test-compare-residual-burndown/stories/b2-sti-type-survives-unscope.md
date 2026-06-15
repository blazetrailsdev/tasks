---
title: "STI type predicate survives unscope(where)"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3419
claim: "2026-06-15T23:22:27Z"
assignee: "b2-sti-type-survives-unscope"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Rails
`test_sti_conditions_are_not_carried_in_default_scope` is ported but skipped
("sti conditions are not carried in default scope") in
`packages/activerecord/src/scoping/default-scoping.test.ts`.

`unscope({where:"title"})` on an STI subclass (ConditionalStiPost) strips the
implicit STI `type IN (...)` predicate along with the `title` default-scope
condition, so the count returns every `posts` row instead of just the STI
subtree. Rails keeps the STI type condition — it is not part of the default
scope's where clause and must survive `unscope(:where)`.

## Acceptance criteria

- [ ] `ConditionalStiPost.unscope({where:"title"}).count()` returns only STI-subtree rows (3 in the Rails scenario), preserving the `type IN (...)` predicate.
- [ ] Un-skip "sti conditions are not carried in default scope" in default-scoping.test.ts; it passes on sqlite.
