---
title: "Teach the call-arg normalizer Ruby's Regexp flag boolean is JS's flag string"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
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

`scripts/api-compare/call-mismatches-exclude/activesupport/parameter-filter.json`
carries one `kind: "args"` row after PR #6614:

```text
compile_filters!  new(ref:join, bool:true)
```

Ruby (`activesupport/lib/active_support/parameter_filter.rb:121-122`):

```ruby
@regexps << Regexp.new(strings.join("|"), true) unless strings.empty?
(@deep_regexps ||= []) << Regexp.new(deep_strings.join("|"), true) if deep_strings
```

`Regexp.new`'s second positional argument is Ruby's ignore-case flag — `true` is
exactly `Regexp::IGNORECASE`. JS spells the same argument as a flag string, so the
port passes `"i"`: `new RegExp(strings.join("|"), "i")`
(`packages/activesupport/src/parameter-filter.ts`, `compileFiltersBang`). Same call,
same arity, same meaning, different spelling of one literal — the gate reports a
`shape` mismatch and the row exists only to absorb it.

A global `bool:true` ≡ `str:i` equivalence in `normalizeArg`
(`scripts/api-compare/call-args.ts`) would be wrong: the equivalence holds only for
`Regexp.new`/`RegExp`, and elsewhere it would mask a real changed-literal defect.

## Converged shape

Teach the argument normalizer a receiver-scoped equivalence rather than a global
one: when the call is a Regexp construction (`Regexp.new` on the Ruby side, `new
RegExp` on the TS side), normalize Ruby's flag argument (`true`,
`Regexp::IGNORECASE`, `Regexp::MULTILINE`) and JS's flag string to
one canonical descriptor, so equivalent flag spellings compare equal. An OR of
two option constants is deliberately NOT in scope: extract-ruby-api.rb:2580
describes any `|` expression as the bare operator (`binop:|`) with its operands
discarded, and `binop:` is an OPAQUE descriptor, so the site is skipped as
uncomparable before the normalizer sees it — covering it would mean widening the
extractor's descriptor grammar for every consumer, and no vendored Rails call
site spells the flag that way. Then delete
the `parameter-filter.json` row by hand (only-shrink, no reseed) and tighten the
mark shard if it goes stale.

Sibling call sites in other packages that construct a Regexp from a Ruby literal
flag get the same treatment for free — worth grepping
`call-mismatches-exclude/**` for other `new(...bool:...)` rows before sizing.

## Acceptance criteria

- [ ] `normalizeArg`/`compareCallArgs` treat Ruby's `Regexp.new(src, true)` and
      `new RegExp(src, "i")` as the same argument list, with a unit test in
      `scripts/api-compare/call-args.test.ts`.
- [ ] The equivalence is scoped to Regexp construction — a `bool:true` vs `str:i`
      mismatch on any other call still reports.
- [ ] The `compile_filters!` row is deleted from
      `call-mismatches-exclude/activesupport/parameter-filter.json` (file removed if
      it empties) and `pnpm parity:api:calls:args` is green.
