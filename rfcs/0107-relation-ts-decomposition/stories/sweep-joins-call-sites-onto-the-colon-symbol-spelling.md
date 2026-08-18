---
title: "Sweep joins/leftOuterJoins association-name call sites onto the colon Symbol spelling (~400 LOC)"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6704
claim: "2026-08-18T15:00:51Z"
assignee: "sweep-joins-call-sites-onto-the-colon-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `retire-relation-is-named-join-value-discriminator`, which
cannot land until it exists.

That story asks `buildJoinBuckets` / `selectAssociationList` to discriminate a
Symbol joins_value from a raw-SQL String the way Rails does — `String === join`
at `query_methods.rb:1852`, `when Hash, Symbol, Array` at
`query_methods.rb:1814` — reading the leading colon CLAUDE.md prescribes for a
Ruby Symbol value (`":posts"`), instead of `Relation#_isNamedJoinValue` /
`_isAssociationName`, which answer the question with a model-association
lookup Rails never performs.

The blocker is the corpus, not the discriminator. Measured on
`bc14d32de`:

- 389 `.joins(...)` call sites in `packages/activerecord/src` do NOT use the
  colon spelling; 3 do.
- 286 of those pass a bare association-name string
  (`.joins("comments")`, `.joins("author")`, `.joins("posts")`, …), i.e. a
  Ruby Symbol spelled without its colon.

Flip the discriminator without migrating them first and every one of those
becomes an `Arel::Nodes::StringJoin` over a bare table word — wrong SQL on all
three adapters. Migrating them inside the retire story is ~400 changed lines on
its own, well past the PR ceiling, so the sweep is its own story.

`relation/symbol-association-join-spec.trails.test.ts` already shows the colon
form flowing through `joins` end to end, so the target spelling is settled and
supported today — this is a mechanical rename of the call sites, not a
behaviour change.

## Acceptance criteria

- [ ] Every `joins` / `leftOuterJoins` / `joins`-through-`merge` call site in
      `packages/activerecord/src` that passes an association NAME passes it in
      the colon spelling (`":comments"`), including the nested-hash and array
      forms' keys and values. Raw-SQL fragments and Arel join nodes are left
      exactly as they are.
- [ ] Fixture/model/test-helper call sites are swept too — test names are NOT
      touched (`parity:test` matches on them).
- [ ] `_isNamedJoinValue` still answers the same set afterwards (it accepts the
      colon form already), so generated SQL is unchanged on all three adapters
      and no test assertion moves. The retire story then deletes it.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
