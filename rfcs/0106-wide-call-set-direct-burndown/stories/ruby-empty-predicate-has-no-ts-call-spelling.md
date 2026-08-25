---
title: "Ruby empty? has no TS call spelling — six relation.ts rows cannot converge without one"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: 6660
claim: "2026-08-17T17:48:13Z"
assignee: "call-mismatches-partial-regen-invents-phantom-rows"
blocked-by: null
closed-reason: null
---

# The `empty?` call rows have no TS spelling — give Ruby `empty?` one

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` and
`wave-1d-relation-query-methods-rows` (PR #6563). Neither could converge its
`empty?` rows, because there is no TS call for the gate to match: Ruby's
`Hash#empty?` / `Array#empty?` becomes `Object.keys(x).length === 0` or
`x.length === 0`, which is a property read, not a call named `empty?`.
`packages/activesupport/src/` has `blank`/`present` but no `isEmpty`.

Rows still baselined in `activerecord/relation.json` (`kind: "set"`), all of
this one shape:

    all_attributes?                    -> empty?
    ensure_valid_options_for_batching! -> empty?
    execute_grouped_calculation        -> empty?
    scope_for_create                   -> empty?
    select_for_count                   -> empty?
    structurally_compatible?           -> empty?

Representative Rails sites:

- `Relation#scope_for_create`, `relation.rb:1231-1235`:
  `create_with_value.each { ... } unless create_with_value.empty?`
- `QueryMethods#structurally_compatible?`,
  `relation/query_methods.rb:1121-1123`:
  `structurally_incompatible_values_for(other).empty?`

`burn-down-result-empty-async-call-rows` (PR #6559) handled the _separate_
`Result#empty` surfacing; these are the plain Ruby-collection ones it left.

## Converged shape

Decide once, then apply across all six rows — do not solve it per-site:

1. Preferred: an ActiveSupport `isEmpty` following the existing `blank` /
   `present` precedent, so `x.empty?` ports as `isEmpty(x)` and the gate
   matches on the name; add the Ruby->TS rule to
   `scripts/parity/conventions.ts` so `docs/ruby-ts-conventions.md`
   regenerates with it.
2. Or, if that is judged invented surface, a `SKIP_GROUPS`-style suppression
   in `scripts/api-compare/compare.ts` for `empty?` against a
   non-ported receiver — note `compare.ts:177-188` documents why the
   enumerable/predicate names are deliberately NOT suppressed today, so this
   arm needs an explicit decision, not a quiet widening.

Option 1 is a convergence; option 2 only stops measuring. Prefer 1.

## Acceptance criteria

- [ ] One mechanism chosen and applied to all six rows.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] If an ActiveSupport helper is added, it is reachable from the docs
      table and `pnpm parity:api:extra` does not grow.
- [ ] `pnpm parity:api:calls` / `:args` green; all three adapter lanes green.
