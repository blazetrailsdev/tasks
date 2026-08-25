---
title: "Move the residual spawn/predicate-builder/from-clause/delegation members out of relation.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-private-thunk-block"]
deps-rfc: []
est-loc: 250
priority: null
pr: 6598
claim: "2026-08-16T14:45:06Z"
assignee: "wave-2c-grouped-calculation-and-query-method-stores"
blocked-by: null
closed-reason: null
---

## Context

The residual misplacements — small enough to bundle into one story, all with an
existing sibling TS file.

**`spawn_methods.rb` → `relation/spawn-methods.ts`** (42 lines, 4 members):

- `only` (`relation.ts:1400`) — Rails `spawn_methods.rb:64`
- `except` (`relation.ts:1432`) — Rails `spawn_methods.rb:53`
- `relationWith` (`relation.ts:7286`, a thunk) — Rails `spawn_methods.rb:72`
- `spawn` (declaration merge, `relation.ts:7370`) — Rails `spawn_methods.rb:10`

Note `only` and `except` also depend on the `@values` story: Rails implements
them as `values.slice(*onlies)` / `values.except(*skips)`, which is only
one-line once `@values` exists. Sequence after it, or move them verbatim now
and converge the bodies there.

**`predicate_builder.rb` → `relation/predicate-builder.ts`** (92 lines):
`build` (`relation.ts` predicate-builder members), `references` (`:5750`),
`with` (`:5708`) — verify each against
`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb`
before moving; `references` and `with` may credit better to `query_methods.rb`
and belong in that story instead.

**`from_clause.rb` → `relation/from-clause.ts`**: `merge` / `mergeBang`
(`relation.ts:7371`/`:7372`, declaration merge) — Rails
`spawn_methods.rb:35`/`:44` for the relation-level pair;
`from_clause.rb:20` for `FromClause#merge`. Check which is which before moving.

**`delegation.rb` → `relation/delegation.ts`**: `name` (`relation.ts:6123`) —
Rails `delegation.rb:20`.

## Acceptance criteria

- Each member listed lands in the TS file matching its Rails counterpart, with
  the counterpart confirmed by reading the Ruby (several are ambiguous above —
  resolve, don't guess).
- Member order matches the Rails source order in each destination file.
- No behavior change; the `relation/` suites pass unchanged.
- `pnpm parity:api` / `parity:test` deltas non-negative;
  `pnpm parity:api:calls` / `:args` clean.
