---
title: "api-compare: resolve Ruby alias arity to target so faithful TS delegators don't false-flag"
status: done
updated: 2026-06-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 4059
claim: "2026-06-24T13:30:40Z"
assignee: "api-compare-resolve-alias-arity"
blocked-by: null
---

## Context

The api-compare Ruby extractor records `alias :visit_X :visit_Y` declarations
with **zero arity** (`()`), not the arity of the aliased target method. So
when trails faithfully ports a Ruby alias as a thin TS delegator with the
real parameters, the advisory arity check flags a mismatch
(ruby `min:0,max:0` vs ts `min:1,max:1` / `min:2,max:2`).

Surfaced by PR #4057 (arel-visitors-primitive-dispatch): porting the Dot /
ToSql alias visitors (`visit_Arel_Nodes_Regexp`, the `visit_String`
primitive aliases, `visit_Set → visit_Array`, the `unsupported` aliases,
etc.) drove arel's advisory arity from 99.6% → ~94.8% — 37 mismatches, all
inherent to alias-vs-target arity, zero real divergences. The same pattern
will recur for every alias-heavy file ported to 100%.

Relevant code:

- `scripts/api-compare/extract-ruby-api.rb` — where `alias`/`alias_method`
  declarations are captured (currently without resolving the target's params).
- `scripts/api-compare/arity.ts` — `shouldSkipArity` / `arityMatches`; a
  fallback could skip arity when the Ruby side is a known alias.

## Acceptance criteria

- The Ruby extractor resolves an `alias`/`alias_method` to its target
  method's parameter list (or marks the entry as an alias), so a faithful
  TS delegator with matching params is NOT flagged.
- Alternatively/additionally, `arity.ts` skips the arity comparison for
  Ruby methods known to be aliases (analogous to `shouldSkipArity`).
- arel's advisory arity returns to ~100% with no code changes to the
  visitor ports.
- Unit coverage in `arity.test.ts` (and/or an extractor test) pins the
  alias-arity behavior.

## Notes

Arity is advisory and never gates CI, so this is a signal-quality fix, not
a correctness blocker. Scope it small — no behavior change to any port.
