---
title: "Make ParameterFilter's case-flag expansion total so every group emits one Regexp"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6622
claim: "2026-08-17T00:00:01Z"
assignee: "teach-call-args-regexp-flag-equivalence"
blocked-by: null
closed-reason: null
---

## Context

PR #6614 converged `ParameterFilter.precompileFilters`
(`packages/activesupport/src/parameter-filter.ts`) onto Rails' one-Regexp-per-group
shape (`activesupport/lib/active_support/parameter_filter.rb:55-68`), spelling
Ruby's inline `(?i:...)` group case-sensitively by expanding each cased character
to a `[aA]` class (`ignoreCaseSource`, parameter-filter.ts:~230).

One residual remains. `ignoreCaseSource` returns null — declining to expand — for a
case-insensitive source whose letters are not all literal:

- a character class (`[` — `[aA]` cannot be nested and a range must not be expanded)
- a Unicode property escape (`\p{...}` / `\P{...}`)
- a named backreference (`\k<...>`)
- a named group (`(?<name>`, but not lookbehind `(?<=` / `(?<!`)

Those patterns ride on as the caller's own `i`-flagged Regexp AFTER the joined one
(`unexpandable.push(pattern.regexp!)`), so the group emits TWO Regexps where Rails
emits one. Rails has no such split: `(?i:...)` scopes the flag to any sub-pattern,
so `filters << Regexp.new(patterns.join("|"))` (parameter_filter.rb:64-65) always
produces exactly one Regexp per group.

Covered by `keeps a case-insensitive pattern the flag expansion cannot rewrite as
its own Regexp` and its deep-pattern sibling in
`packages/activesupport/src/parameter-filter.trails.test.ts`.

## Converged shape

Make `ignoreCaseSource` total, so `precompileFilters` emits exactly one Regexp per
group for EVERY input, and the `unexpandable` array and its push disappear:

- character class: expand cased members in place (`[xy]` → `[xXyY]`) and expand a
  cased range endpoint-wise (`[a-c]` → `[a-cA-C]`), which is what `(?i:)` does
- `\p{L}` / `\p{Lu}` / `\p{Ll}`: under `/i` Ruby matches both cases, so `\p{Lu}`
  and `\p{Ll}` both widen to `\p{L}`; other properties pass through unchanged
- named group / named backreference: copy the `<name>` span verbatim (letters
  inside it are not pattern letters) rather than bailing on the whole source

Escaped strings — the only sources Rails itself wraps in `(?i:...)` — never contain
any of these, so this is about parity for caller-supplied `/…/i` filters.

## Acceptance criteria

- [ ] `ignoreCaseSource` returns a string for every source `precompileFilters` can
      receive; the `unexpandable` fallback in `precompileFilters` is deleted.
- [ ] The two `*.trails.test.ts` cases above are rewritten to assert ONE Regexp per
      group for those same inputs, with the match/no-match behaviour unchanged.
- [ ] `pnpm parity:api:calls` and `:args` stay green with no new rows.
