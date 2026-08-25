---
title: "Converge ParameterFilter's case expansion onto Ruby's inline (?i:...) group"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6627
claim: "2026-08-17T02:22:52Z"
assignee: "converge-parameter-filter-ignore-case-onto-inline-group"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while measuring `converge-parameter-filter-joined-regexp-unicode-flag-argument`
(PR #6625), which is blocked on the _Unicode_ flag. The _case_ half of the same
problem is no longer blocked and should converge.

Rails spells a case-insensitive alternative inline, so one joined Regexp can
carry both case-sensitive and case-insensitive parts:

```ruby
# activesupport/lib/active_support/parameter_filter.rb:58-59
patterns.map! do |pattern|
  pattern.is_a?(Regexp) ? pattern : "(?i:#{Regexp.escape pattern.to_s})"
end
```

`packages/activesupport/src/parameter-filter.ts` cannot use that today, so it
carries ~150 lines of hand-rolled substitute — `ignoreCaseSource`,
`ignoreCaseClass`, `ignoreCaseProperty`, `bothCases`, `swapCase`, `classEnd` —
which rewrites every cased character into a `[aA]` class, every character-class
member into its folded pair, and `\p{Lu}`/`\p{Ll}` into `\p{L}`. Each of those
helpers is invented surface with no Rails counterpart, and each is a place a
subtle case-folding divergence can hide (the `\P{Lu}` complement arm and the
named-group/backreference skip spans are both hand-derived).

**V8 now ships the ES2025 regexp modifiers proposal**, verified on Node
v24.16.0: `new RegExp("(?i:a)").test("A")` is `true`, and
`new RegExp("(?i:\\p{Lu})", "u").test("a")` is `true` — i.e. the inline group
also case-folds a Unicode property escape the way Ruby does, which is precisely
what `ignoreCaseProperty` hand-approximates.

## Converged shape

Spell the case-insensitive member exactly as parameter_filter.rb:59 does —
`` `(?i:${escapeRegexp(String(filter))})` `` — and delete `ignoreCaseSource`
and its five helper functions. `precompileFilters` then reads line for line
against the Ruby, and one joined Regexp per group is preserved.

Confirm the runtime floor first: modifiers need V8 12.5+ (Node 22+). If the
repo's supported Node range includes an older release, this story is a no-go
and should be blocked with that range cited, not half-applied.

Note this does **not** unblock the sibling story: modifiers cover `i`/`m`/`s`
only. `(?u:…)` is rejected by V8 as `Invalid group`, so the joined Regexp's
Unicode flag stays a constructor argument and `escapeRegexp` still cannot
escape `-`.

## Acceptance criteria

- `precompileFilters` maps a String filter to `(?i:…)` as parameter_filter.rb:59
  does; `ignoreCaseSource`, `ignoreCaseClass`, `ignoreCaseProperty`,
  `bothCases`, `swapCase` and `classEnd` are deleted.
- `pnpm parity:api:extra --package activesupport` drops by those six names.
- The `parameter-filter.trails.test.ts` cases keep asserting ONE Regexp per
  group, with match/no-match behaviour unchanged for `/\p{Lu}q/iu`.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
