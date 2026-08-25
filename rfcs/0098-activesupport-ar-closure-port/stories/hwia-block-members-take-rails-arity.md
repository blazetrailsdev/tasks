---
title: "HashWithIndifferentAccess's block members take (key, value), not Rails' shapes"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6575
claim: "2026-08-15T19:15:06Z"
assignee: "apply-join-dependency-limitability-guard-extracted-twice"
blocked-by: null
closed-reason: null
---

# HashWithIndifferentAccess's block members take `(key, value)`, not Rails' shapes

## Context

Surfaced in PR #6568 while porting the converter group.

`hash_with_indifferent_access.rb:323-343` overrides `select`, `reject` and
`transform_values` by delegating to `Hash`'s own, so their blocks keep Ruby's
`Hash` arities: `select`/`reject` yield `|key, value|` but return a
HashWithIndifferentAccess built from the pairs, `transform_values` yields
`|value|`, and `each`/`each_pair` yield the `[key, value]` pair.

trails' `packages/activesupport/src/hash-with-indifferent-access.ts` gives
`select`, `reject`, `each`, `find`, `count`, `map`, `flatMap`, `minBy` and
`maxBy` a uniform `(key, value)` callback of its own invention. `map` is the
sharpest: Ruby `Hash#map` yields the pair and trails yields two arguments, so a
faithful `hash.map { |k, v| ... }` port reads correctly but
`hash.map(&:first)` has no spelling.

Related to `retire-hwia-invented-enumerable-members`, which deletes the members
that have no Rails counterpart at all; this story converges the arity of the
ones that do.

## Converged shape

Each member keeps Rails' name and takes the block arity Ruby's `Hash` gives it.

## Acceptance criteria

- [ ] `select`, `reject`, `each`, `map`, `find`, `count` match Ruby `Hash`
      block arity; callers updated.
- [ ] `pnpm parity:api` arity mismatches for the file drop to 0.
- [ ] No new `parity:api:extra` surface.
