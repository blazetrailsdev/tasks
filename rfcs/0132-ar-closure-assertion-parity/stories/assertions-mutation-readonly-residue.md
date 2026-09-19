---
title: "assertion parity: mutation symbol-order table value and readonly notEmpty"
status: draft
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two rows left by trails#7883 in files it touched.

1. `packages/activerecord/src/relation/mutation.test.ts`, the two "with symbol prepends the table name" tests (`vendor/rails/activerecord/test/cases/relation/mutation_test.rb:25,80`). Rails builds `Relation.new(FakeKlass)` and expects `node.expr.relation.name == "posts"` with `node.expr.name == "name"`. The port uses `Developer` (table `developers`) because `Post.all().orderBang(":name")` yields a `SqlLiteral` with no `.expr.name`. Converge onto a `posts`-backed relation; value mismatch is still reported.
2. `packages/activerecord/src/readonly.test.ts`, `has many find readonly` (`readonly_test.rb:` `assert_not_empty post.comments`). No TS matcher maps to the `notEmpty` kind; `.not.toHaveLength(0)` counts as `length`.

## Acceptance criteria

Both tests report 0 assertion-kind and 0 assertion-value mismatches in `pnpm parity:test -- --package activerecord --assertions --missing`.
