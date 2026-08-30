---
title: "param-drift-rack-structural-residue"
status: draft
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
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

`param-drift-rack` took rack from 29 param-name rows to 1 and enrolled it in
`pnpm parity:api:params` at a mark of 1. The survivor is a name collision, not a
rename.

`Rack::Headers` aliases `key?` to `has_key?(key)`
(`vendor/rack/lib/rack/headers.rb:144-148`). Under
`docs/ruby-ts-conventions.md` a Ruby `?` predicate drops the mark, so `key?`
normalises to the TS name `key` — which `packages/rack/src/headers.ts:221`
already uses for the _other_ Ruby method, `Hash#key(value)` (returns the key for
a value; inherited, not redefined in headers.rb). `has_key?` itself is ported as
`hasKey` (`headers.ts:77`), so the alias has no TS declaration of its own and
the comparer scores it against `key(value)`, reporting `value` as a rename of
`key`.

Two shapes to weigh: give `key?` its own declaration under a spelling that does
not collide (and check `include?` / `member?`, the other two aliases of
`has_key?`, at the same time), or record the collision in `SCOPED_SKIP_GROUPS`
in `scripts/parity/conventions.ts` — note the CLAUDE.md warning to grep
`SCOPED_SKIP_GROUPS` before adding a global `SKIP`.

## Acceptance criteria

- The position carries the Rails identifier, verified against `vendor/rack` at
  the cited `file:line`, or it is a `pnpm tasks block` naming the shortcoming.
- rack's mark in `scripts/api-compare/param-name-mark.json` is narrowed with
  `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports rack 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
