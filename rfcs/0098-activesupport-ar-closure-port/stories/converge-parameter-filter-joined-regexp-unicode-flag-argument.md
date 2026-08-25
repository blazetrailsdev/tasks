---
title: "Converge ParameterFilter's joined-group Regexp onto Rails' one-argument Regexp.new"
status: closed
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Permanent JS language shortcoming, verified on Node 24 (v24.16.0) and not going to change: Ruby's Regexp#to_s embeds each member's flags inline and its engine is Unicode-aware unconditionally, while JS has no inline spelling for the u flag ('(?u:...)' throws, and the ES2025 modifiers V8 ships cover i/m/s only), so a joined group containing any \\p{...} member must carry u as a constructor argument. Criterion 3 is coupled to the same fact. Closing rather than carrying it as a perpetual blocked row; reopen only if trails drops caller-supplied u/v-flagged filters or a future modifier syntax admits u."
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
