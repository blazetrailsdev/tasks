---
title: "Re-check whether RFC 0129 receiver-kind proof reaches first/last/any?/size's Relation-ambiguous rows"
status: in-progress
updated: 2026-09-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#7865
claim: "2026-09-18T14:31:49Z"
assignee: "receiver-typing-for-positional-array-idioms"
blocked-by: null
closed-reason: null
---

## Context

RFC 0092's `positional-idiom-analogues` (trails#6269, done, 2026-08-09) asked
whether the comparator could distinguish an Array/Hash receiver from a
Relation/association receiver for `first`/`last`/`any?`/`size` (Ruby idioms
that are dangerous to alias globally: `Relation#first`/`#last` dispatch to
`find_nth_with_limit`/`find_last`, `#size`/`#empty?`/`#any?` hit the DB —
`connection-adapters` aside, `relation.rb`). It measured "no" and left
`compare.ts`'s `NO_JS_CALL_FORM` / `enumerable-idioms.ts`'s
`JS_ENUMERABLE_ALIASES` deliberately untouched (see the "DELIBERATELY NOT
suppressed" comment at `scripts/api-compare/compare.ts:231-263` and the mirror
note at `scripts/api-compare/enumerable-idioms.ts:19-31`). The blocking
population, per that measurement: of 106 activerecord call-mismatch rows for
these five names, the extractor's inert-receiver filter (RFC 0083 `weakCalls`)
already proved zero are safe; survivors are ivars (`@stack.last`), bare
self-calls, constants and method chains — exactly where a real Relation query
trigger (`scope.first`, `records.first`, `group_values.any?`) sits alongside a
safe Array read, with no syntactic signal to tell them apart.

Since then, RFC 0129 (`record-ruby-call-receiver-hints`, trails#7334,
2026-09-01) shipped a real receiver-typing mechanism:
`extract-ruby-api.rb`'s `walk_call_in_order` now records a per-call-site
`callReceivers` kind — `hash`/`array`/`string`/`symbol`/`numeric` for a
literal receiver or a local Ripper proves is one (every assignment a matching
literal), and the unproven shapes by shape (`self`/`local`/`ivar`/`const`/
`expr`) otherwise. `scripts/parity/ruby-compat.ts` already keys ambiguous
core-Ruby calls (`fetch`, `merge`) on it.

I re-checked whether this closes the `positional-idiom-analogues` gap
(2026-09-18): it does not, by RFC 0129's own measurement. Its commit message
reports that of the 43 `fetch`/`merge` rows it targeted, none had a
Ripper-provable receiver — "ivars, chained expressions, locals with no
hash-literal assignment" — the identical shape `positional-idiom-analogues`
found blocking `first`/`last`/`any?`/`size`. `callReceivers` only proves
literals and provably-literal locals; it says nothing about an ivar, a bare
`self`-call, or a chained expression's actual runtime class, which is where
essentially all of the surviving 106 rows live.

## What this story is

A genuine, still-open design question, not a quick mechanical fix: is there
ANY way — short of full type inference — to extend receiver-kind proof to
reach a useful slice of the ivar/self/const/chain population for these five
names specifically, without weakening the guardrail for a real Relation
receiver? Candidates to evaluate and falsify or confirm with real data (mirror
the rigor of the original 2026-08-08 audit and RFC 0129's own commit):

- **Per-class ivar typing.** Ruby's `@ivar` assignments in the SAME class are
  syntactically enumerable. If ripper can prove every assignment to `@stack`
  in a class is an Array literal (`@stack = []`) and the class has no
  `attr_writer`/`attr_accessor` exposing it externally, that's the same kind
  of proof `callReceivers` already does for locals — just scoped to the
  class instead of the method. Needs receiver-kind data keyed by
  (class, ivar name), not just per-call-site, and a check that nothing
  reassigns it from outside that proof.
- **Method-chain root typing.** A chain's root (e.g. `default_scopes.any?`,
  `group_values.any?`) is itself a call whose OWN return type may be provable
  from Rails' method signatures for well-known ActiveRecord readers (many of
  which are known to return plain Arrays, e.g. `group_values`,
  `default_scopes`) vs. Relation-returning ones (`scope`, `all`, `where(...)`).
  Whether that's worth a hand-maintained allow-list (and how it would be kept
  honest against Rails source drift) is exactly what this story should decide.
- **Bare self-calls.** `any?`/`first` etc. called with no explicit receiver
  inside a method whose OWN return/self type is provably non-Relation (e.g. a
  method on a plain Ruby object, not `ActiveRecord::Base`/`Relation`/
  association code) might be provable from the enclosing class's ancestry,
  which the comparator's Ruby extractor may already have from
  `rails-api.json`'s class hierarchy.

The honest outcome may again be "no" for some or all of these — that is an
acceptable, valuable close, same as `positional-idiom-analogues`' original
close. Do not weaken `NO_JS_CALL_FORM` or add a positional/property alias
table entry for a receiver kind you cannot prove; a wrong credit here silently
hides a dropped query trigger, which is worse than the current per-row triage
route.

## Acceptance criteria

- A written determination for EACH candidate above (or any other mechanism
  found), backed by a real measurement against the current
  `call-mismatches-exclude/activerecord` population for `first`/`last`/
  `any?`/`size`/`empty?` — not an assertion. State how many of the current
  rows for each name would be provably safe to credit under each mechanism,
  and how many remain genuinely ambiguous.
- If a mechanism is found that can prove SOME rows safe without risking a
  false credit on a real Relation/association receiver: implement it as a
  narrow, receiver-kind-gated addition (mirroring RFC 0129's
  `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` shape — admitted only where every
  site's proven kind matches), unit-tested, with the "DELIBERATELY NOT
  suppressed" comments in `compare.ts` and `enumerable-idioms.ts` updated
  (not deleted) to record the narrower remaining gap.
- If no mechanism clears the bar: the finding is recorded in both files
  (superseding the still-accurate-but-now-stale 2026-08-08-only citation) so
  the next reader sees that RFC 0129 was checked against this exact question
  and still didn't close it, without re-deriving the investigation.
- Any resulting baseline shrinkage goes through `pnpm parity:api:calls:reseed`
  (never a hand-edited exclude JSON), and `pnpm parity:api:calls` ends green
  with zero mark slack.
- No row converges whose TS body actually drops a query trigger — spot-check
  at least five converged Relation/association-receiver-adjacent candidates
  by hand and record them in the PR body, same discipline as
  `positional-idiom-analogues`' own audit addendum.
