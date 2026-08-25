---
title: "A Ruby home bucket spans several TS files; the override can only name one"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6238
claim: "2026-08-08T15:03:58Z"
assignee: "pg-ddl-quoting-suite-builds-its-own-adapter-instead-of-leasing"
blocked-by: null
closed-reason: null
---

## Context

`RUBY_FILE_TS_OVERRIDES` maps one Ruby file to exactly one TS file, but a Ruby
class's _home bucket_ can legitimately span several. PR #6235 hit this while
re-homing the bucket the barrel fix freed up:

`activesupport:core_ext/object/acts_like.rb` is the first `core_ext` file to
reopen `Object`, so every later reopening dedupes into it and the bucket is
really "Object's methods" — `blank?` / `present?` / `presence`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb:14-46`),
`duplicable?` (`core_ext/object/duplicable.rb:26`), `instance_values` /
`instance_variable_names` (`core_ext/object/instance_variables.rb:19-30`), plus
`acts_like?` itself (`core_ext/object/acts_like.rb:8`), which is duck typing in
JS and has no port at all. trails ports those arms to three separate files:
`core-ext/object/blank.ts`, `core-ext/object/duplicable.ts`,
`core-ext/object/instance-variables.ts`.

PR #6235 pointed the override at `core-ext/object/blank.ts` — the reopening
carrying the largest arm — which takes the bucket from 2/10 to 4/10. The other
two files' arms still read as missing even though they are ported, because the
override can only name one destination.

## Converged shape

Let a Ruby file's bucket resolve against a _set_ of TS files: either
`RUBY_FILE_TS_OVERRIDES` accepting an array, or the home-bucket dedupe crediting
a method to whichever reopening file actually defines it (so `blank?` is
measured against `blank.ts` and `duplicable?` against `duplicable.ts`) rather
than pooling them all onto the first file to open the class.

The second is the better shape — it fixes the class of problem, not one entry —
and matches how `mixinMethodCreditedToOwnFile` already credits an included
method to its own file rather than the aggregator's.

## Acceptance criteria

- [ ] `core_ext/object/acts_like.rb`'s bucket measures each Object arm against
      the TS file trails actually ports it to; `acts_like?` stays the only
      genuinely-unported member.
- [ ] The `activesupport:core_ext/object/acts_like.rb` override added by #6235
      is removed once the general path covers it.
- [ ] The barrel exclusion from #6235 stays unchanged.
- [ ] Unit test in `scripts/api-compare/compare.test.ts`; `pnpm parity:api:calls`
      green; `pnpm parity:api` delta non-negative.
