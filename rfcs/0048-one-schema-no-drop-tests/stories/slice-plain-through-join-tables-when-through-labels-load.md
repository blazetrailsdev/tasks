---
title: "Slice plain has_many:through join tables when through-label loading is wired in"
status: done
updated: 2026-07-06
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 7
pr: 4672
claim: "2026-07-06T13:41:00Z"
assignee: "slice-plain-through-join-tables-when-through-labels-load"
blocked-by: null
closed-reason: null
---

## Context

PR #4603 narrowed `sliceSchema`/`throughJoinTableNames`
(`packages/activerecord/src/test-helpers/`) to pull in ONLY HABTM join tables
(`macro === "hasAndBelongsToMany"`), because a plain `has_many :through` join
table belongs to a real model whose fixture set is requested by name (and slices
its own table in). This bounded the derived schema so the canonical-model
autoload index is safe to install globally.

`throughLabelAssociations` (the fixture-load join-row materializer) still expands
plain-through labels too, but it currently has **no production caller** — see the
guard-rail NOTE on `throughJoinTableNames` in `define-fixtures.ts`.

## The gap to close

When `throughLabelAssociations` (or its successor) IS wired into actual fixture
loading, a fixture row that expands a plain `has_many :through` association label
whose owner's requesting test does NOT also name that through-model's fixture set
by name will hit "no such table" — `sliceSchema` no longer creates that join
table implicitly. HABTM labels are unaffected.

## Acceptance criteria

- [ ] When the through-label materializer is wired into loading, either:
      (a) `sliceSchema` pulls in the plain-through join table too (bounded so it
      does not re-introduce the global-autoload balloon PR #4603 fixed), OR
      (b) loading surfaces a precise error naming the missing through-model
      fixture set, not an opaque "no such table".
- [ ] A regression test exercises a plain-through label expansion under the
      requested-sets slice.
- [ ] Global-autoload boundedness (deriveFixtureSchema exactly
      `[authors, posts, categories_posts]`) is preserved.
