---
rfc: "0000-branch-and-guard-parity"
title: "Branch and guard parity — the axis the call gates cannot see"
status: draft
created: 2026-08-18
updated: 2026-08-18
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "activesupport"
  - "actionpack"
  - "actionview"
  - "arel"
  - "date"
  - "trailties"
clusters:
  - "arm-parity-tooling"
  - "missing-arm"
  - "invented-arm"
  - "arm-order"
  - "guard-parity"
related-rfcs:
  - "0111-error-class-message-parity"
  - "0023-surfaced-deviations"
  - "0084-wide-call-set-burndown"
  - "0095-call-argument-parity"
  - "0108-call-gate-false-positives"
---

# RFC — Branch and guard parity

## Summary

A ported body can call everything Rails calls, with exactly the right arguments,
and still drop an `elsif`. Both existing call gates stay green. **Control flow is
the axis nothing measures**, and it is where behaviour actually lives.

71 open `0023-surfaced-deviations` stories describe a missing arm, an invented
arm, a wrong arm order, or a guard Rails does not have — roughly 7,500 estimated
LOC across ten packages. This RFC proposes a report-only arm-signature
comparison, then a burndown.

## Motivation

### What the current gates measure

- **RFC 0084** gates the _call set_ — which methods a body calls.
- **RFC 0095** gates the _call arguments_ — count, order, literal values, kwarg
  keys.

Both read `scripts/api-compare/call-mismatches-exclude/`. Neither observes how
many arms a body has, in what order, or with which guards, **because neither
measures anything but calls**. That is a property of what they were built to do,
not a defect in them.

### The backlog says so in its own words

`sqlite3-translate-exception-branch-set` records that PR #6375 _"converged the
argument lists in this function but deliberately did not touch its branch
structure"_. What it left behind: an invented `String or BLOB exceeded size
limit → ValueTooLong` arm Rails does not have, a missing
`SQLite3::BusyException → StatementTimeout` arm
(`sqlite3_adapter.rb:706`), and a different arm order — in a six-arm method,
with both gates green throughout.

`find-nth-from-last-index-base-and-order-guard` says its two divergences were
_"left alone there because they are behavioral rather than call-set rows"_.
Eight stories in the register carry explicit "the tooling cannot see this"
language.

### What a dropped guard costs

`Relation#compute_cache_version`'s loaded branch takes a `max` over timestamps.
Ruby's `Array#max` raises on a `nil`. The trails port:

```ts
.reduce((max: unknown, value: unknown) => {
  if (max == null) return value;
  if (value == null) return max;   // <- Ruby raises here
  …
})
```

Every call Rails makes is made. The guard that turns bad data into an exception
is not, so a nil timestamp silently yields a cache version instead of failing.
No gate in the repo can see that, and no reviewer catches it reliably either —
which is the argument for tooling rather than vigilance.

## Design

### Arm signatures

The Ruby side is already an AST. `scripts/api-compare/extract-ruby-api.rb` is a
Ripper walker; conditional nodes — `if` / `elsif` / `unless` /
`case`-`when` / `rescue` / guard-style early `return` — are already in the tree
it walks and are simply not recorded.

Emit, per method, an ordered **arm signature**: the sequence of arm kinds, plus
the predicate's shape where it normalises cheaply (a bare truth test, a type
test, a comparison). Do the same on the TS side. Compare, and report a mismatch
in arm **count** or arm **order**.

### What the gate deliberately does not do

**Do not compare predicate semantics.** That is where this drowns. Ruby's
`unless x` against an inverted TS `if (!x)` is the same arm; a `case` lowered to
a lookup table is the same dispatch; a guard clause hoisted above a block is the
same guard. Any of those, treated as a mismatch, produces noise faster than
signal.

RFC 0108 exists specifically to absorb call-gate false positives. This RFC
should learn from that rather than reproduce it: **ship report-only first**,
exactly as RFC 0095 did with its `naming` rows, and promote to gating only once
the noise floor is measured.

### Representative stories

| est-loc | story                                                 |
| ------: | ----------------------------------------------------- |
|     220 | `type-registry-missing-klass-arm-and-varargs-lookup`  |
|     150 | `type-decimal-has-no-numeric-rational-cast-arm`       |
|     150 | `scheme-key-provider-adds-an-encryptor-early-return`  |
|     120 | `sqlite3-translate-exception-branch-set`              |
|     120 | `time-change-local-and-utc-offset-arms-conflated`     |
|     120 | `date-datetime-cast-value-three-arm-dispatch`         |
|     120 | `compute-cache-version-max-swallows-nil`              |
|     120 | `discriminate-local-level-symbol-arm-from-string-arm` |

Note `sqlite3-translate-exception-branch-set` is itself a merge of three
separate stories that had all independently found the same method — evidence
that this class is currently being rediscovered rather than tracked.

## Non-goals

- **Predicate-semantics equivalence.** Explicitly out; see Design.
- **Gating in the first phase.** Report-only until the noise floor is known.
- **Ruby idioms that change arm _count_ legitimately.** A Ruby `||=` is one arm;
  its faithful TS spelling may be two. Those belong in
  `0082-ruby-ts-idiom-conversion-classes`, not here — and if they prove common,
  they are a reason to narrow this gate, not to baseline them.
- **Arms missing because the whole method is unported.** That is the 143-story
  unported-surface class in 0023; a method with no TS body has no signature to
  compare.

## Alternatives considered

- **Leave it to review.** This is the status quo and the reason the class has 71
  stories. Three separate agents independently filed the same sqlite3
  `translate_exception` finding; review is not catching it.
- **Extend RFC 0095 rather than a new RFC.** 0095 is about call _arguments_ and
  has a settled artifact, contract and vocabulary. Arm structure is a different
  measurement over a different extraction, and folding it in would blur a gate
  that is currently precise about what it claims.
- **Compare full ASTs.** Maximally sensitive, unusably noisy across two
  languages with different lowering. Rejected without prototyping.
- **Skip the tooling; just fix the 71 stories.** The honest fallback if the
  noise floor is bad — but attempted second, not first. Without a gate the class
  regrows silently, which is exactly how it reached 71.

## Rollout

Story IDs are assigned when the RFC moves to `active` and the 71 stories
re-home.

1. **Phase 1 — Ruby-side extraction.** Record conditional nodes in
   `extract-ruby-api.rb`. Output only; nothing consumes it yet.
2. **Phase 2 — TS-side extraction and the comparison report.** A
   `parity:api:arms:report` command, mirroring
   `parity:api:calls:args:report`. **Measure the false-positive rate on a
   hand-audited sample before writing a single convergence story.**
3. **Phase 3 — decision gate.** If the noise floor is acceptable, seed a
   baseline and promote to gating on the RFC 0084 only-shrink contract. If it is
   not, stop here and run Phases 4-5 ungated, recording the measured rate in this
   RFC's changelog.
4. **Phase 4 — the specified methods.** Stories like
   `sqlite3-translate-exception-branch-set` that already name the exact arm list
   and order. No investigation needed, only the edit.
5. **Phase 5 — the rest**, prioritised by whether the missing arm is a _raise_.
   A dropped raise is a silent wrong answer; a dropped fast path is a
   performance note. They are not the same severity and should not be worked in
   filing order.

## Verification

- `parity:api:arms:report` exists and runs in CI.
- **The Phase 3 decision is recorded with its number** — the measured
  false-positive rate on the audited sample, whichever way it goes. A "we tried
  and it was too noisy" outcome with a figure attached is a successful RFC; one
  without a figure is not.
- If gated: the arms baseline is only-shrink and reaches 0 rows for the 71
  in-scope stories' methods.
- If ungated: all 71 stories reach `done`, and the Phase 4 subset is verified by
  arm-for-arm diff against the cited Rails `file:line` in review.
- No story converges by adding a baseline row.

## Open questions

1. **What false-positive rate is acceptable?** **Recommendation:** set the
   tripwire before measuring, not after — if more than roughly one third of
   reported mismatches are lowering artefacts rather than real divergences,
   take the ungated path. Writing the threshold down first is what stops the
   gate being tuned until it agrees with us.
2. **Does the TS side need a real parser or will the existing extraction do?**
   The api-compare TS extraction already walks a TypeScript AST for definitions
   and calls. **Recommendation:** confirm in Phase 2 that it exposes statement
   bodies, not just signatures — if it does not, that is a larger Phase 1 than
   this RFC assumes and the estimate needs revising before adoption.
3. **Should `rescue` / `catch` arms count?** Rails' `translate_exception`
   family makes them load-bearing, but TS `try/catch` shapes differ more than
   `if/else` does. **Recommendation:** include them in the report, exclude them
   from any gate until Phase 3 has data.
4. **Severity split.** Phase 5 proposes ordering by whether the missing arm
   raises. **Recommendation:** confirm that split is derivable from the story
   bodies; if it needs a human read of all 71, it is not worth the ordering.

## Changelog

- 2026-08-18: initial RFC, carved out of `0023-surfaced-deviations` by the
  backlog triage pass.
