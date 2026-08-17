---
title: "Converge ParameterFilter's joined-group Regexp onto Rails' one-argument Regexp.new"
status: blocked
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-08-17T01:22:52Z"
assignee: "admit-index-by-and-compact-blank-to-receiver-as-first-arg"
blocked-by: "Blocked on a JS language shortcoming, verified on Node 24 (v24.16.0). Ruby needs no second argument because Regexp#to_s embeds each member's flags inline — patterns.join('|') yields '(?-mix:foo)|(?i:bar)' — and its engine is Unicode-aware unconditionally. JS has no such spelling for the Unicode flag: 'new RegExp(\"(?u:\\\\p{Lu})\")' throws 'Invalid regular expression: Invalid group', and the ES2025 modifiers proposal V8 does ship covers i/m/s only ('(?i:a)'.test('A') is true), never u. Since \\p{...} is a property escape only under u/v — 'new RegExp(\"\\\\p{Lu}\").test(\"A\")' is false, and it matches the literal text 'p{Lu}' instead — a joined group containing any member written with u must carry the flag, and in JS the flag is a constructor argument. Candidate 1 from the story (rewrite \\p{...} into a u-free equivalent during the case-flag expansion) does not close it either: a u-free equivalent of an arbitrary Unicode property is its full code-point range table, which JS exposes no API to obtain, and the flag is needed for a member copied verbatim (non-ignoreCase) just as much as for an expanded one. Criterion 3 is coupled to the same fact and is unreachable while any group can carry u: 'new RegExp(\"\\\\-\", \"u\")' and the v form both throw 'Invalid escape', so escapeRegexp cannot restore the '-' escape. Unblocks if trails drops support for caller-supplied u/v-flagged filters, or if a future modifier syntax admits u."
closed-reason: null
---

## Context

PR #6622 made `ParameterFilter.precompileFilters`' case-flag expansion total, so
every group emits ONE joined Regexp as Rails does
(`activesupport/lib/active_support/parameter_filter.rb:64-65`,
`filters << Regexp.new(patterns.join("|")) if patterns.any?`).

A `\p{...}` escape only means a Unicode property under a `u`/`v`-flagged JS
Regexp, so the joined Regexp must carry the widest Unicode flag any member of
the group was written with (`unicodeFlag`, `packages/activesupport/src/parameter-filter.ts`).
That second constructor argument is one Ruby does not pass — a Ruby Regexp is
Unicode-aware with no flag to say so — so the site now carries a `kind: "args"`
row in
`scripts/api-compare/call-mismatches-exclude/activesupport/parameter-filter.json`:

```text
precompile_filters  new(ref:join)
```

Two knock-on deviations ride with it, both in
`packages/activesupport/src/parameter-filter.ts`:

- `escapeRegexp` no longer escapes `-`, because `\-` is an illegal identity
  escape under a `u`/`v`-flagged Regexp and an escaped string filter can be
  joined into one. Ruby's `Regexp.escape("-")` IS `"\\-"` (verified with
  `ruby -e 'puts Regexp.escape("-")'`), so the helper's "Mirrors Ruby's
  `Regexp.escape`" claim is now approximate. Behaviourally a no-op — `-` is
  literal outside a character class in both languages.
- A member source written WITHOUT `u` that carries some other `u`-illegal
  escape would throw when joined into a `u`-flagged group. No such source
  exists in-tree; it is reachable only by a caller mixing a `/…/u` filter with
  an exotic non-`u` one.

## Converged shape

Find a spelling of the joined group Regexp that needs no second constructor
argument, so the call matches `Regexp.new(patterns.join("|"))` argument for
argument and the baseline row is deleted (only-shrink, by hand, no reseed).

Candidates to evaluate, cheapest first:

- Rewrite each `\p{...}` / `\P{...}` escape into a `u`-free equivalent during
  the case-flag expansion (`ignoreCaseSource` / `ignoreCaseProperty`), so no
  group ever needs the flag. This also retires the `escapeRegexp` `-` deviation
  and the mixed-flag throw in one move.
- Failing that, establish whether the whole precompiled group can be built
  under a single always-on `u`, which would make the argument constant rather
  than computed — still an extra argument, so this only helps if it lets the
  flag move somewhere the comparator does not read as an argument.

If neither converges, the row stays and this story is `pnpm tasks block`ed with
the specific blocker — but "it would be a bigger diff" is not one.

## Acceptance criteria

- [ ] `precompileFilters` constructs each group's Regexp with ONE argument, as
      `parameter_filter.rb:64-65` does.
- [ ] The `precompile_filters` / `new(ref:join)` row is deleted from
      `call-mismatches-exclude/activesupport/parameter-filter.json` (file removed
      if it empties) and `pnpm parity:api:calls:args` is green.
- [ ] `escapeRegexp` escapes `-` again, matching `Regexp.escape` byte for byte
      for the characters it covers.
- [ ] The `parameter-filter.trails.test.ts` cases keep asserting ONE Regexp per
      group, with match/no-match behaviour unchanged for `/\p{Lu}q/iu`.
