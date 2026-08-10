---
title: "compareCallArgs reports WHY a site was skipped, so a silent population loss is countable"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: null
packages: []
deps:
  - call-args-artifact-and-report
deps-rfc: []
est-loc: 90
priority: null
pr: 6343
claim: "2026-08-10T15:43:28Z"
assignee: "call-args-arel-population-recheck"
blocked-by: null
closed-reason: null
---

## Context

`call-args-kwargs-string-comma-splitting` (PR #6316) fixed a grammar ambiguity
that had been silently dropping whole call sites from the call-argument
comparison — a `kwargs{}` whose string value contained a `,` split into a
fragment with no `=`, `normalizeKwargs` returned null, and
`compareCallArgs` returned `skip`.

The defect itself was cheap. Finding it was not, and the story said why: **"the
loss is invisible today because nothing counts skips by reason."** It had to be
measured with a throwaway Python tally over `output/rails-api.json` /
`output/ts-api.json`, reconstructing `splitPairs` outside the comparator, purely
to answer "how many sites is this costing us". That harness is gone.

`compareCallArgs` (`scripts/api-compare/call-args.ts`) already knows the reason
at every `return empty` — it just discards it. Today there are five distinct
ones, and they are not equally benign:

| reason                                                                   | site                                |
| ------------------------------------------------------------------------ | ----------------------------------- |
| excluded call name (`super`, `NO_JS_CALL_FORM`, `JS_ENUMERABLE_ALIASES`) | `isSkippedCallName`                 |
| uncomparable flag (`splat` / `blockpass` / `zsuper`) on either side      | `hasUncomparableFlag`               |
| opaque descriptor in the Ruby list                                       | `normalizeArgs(ruby.args) === null` |
| opaque descriptor in the TS list                                         | `normalizeArgs(ts.args) === null`   |
| unparseable numeric token (`123n`)                                       | `normalizeLiteralArg`               |

The first two are deliberate exclusions and should stay flat. The last three are
the population the dimension is LOSING, and a spike in any of them is the
signature of exactly the class of bug #6316 was: an under-approximation that is
safe, silent, and eats the load-bearing sites (RFC 0095 §2 — "byte-comparing SQL
fragments is what surfaces the argument-order finding").

Sizing note: this is only useful once there is somewhere to put the number.
`call-args-artifact-and-report` writes `output/call-arg-mismatches.json` with
`compared` / `mismatched`; the tally belongs beside them as a `skipped` object,
so pick this up after that story, not before.

## Acceptance criteria

1. `compareCallArgs` returns the skip REASON alongside the `skip` verdict — a
   discriminated field on `CallArgResult`, not a second return channel. The
   existing verdict values and every current call site's behaviour are
   unchanged.
2. `output/call-arg-mismatches.json` gains a `skipped: { <reason>: <count> }`
   object next to `compared` / `mismatched`, flat across packages the same way.
3. The `--report` mode prints the tally, so a reviewer can see at a glance
   whether a normalization change moved the comparable population rather than
   only the flagged one.
4. A test per reason, so a later refactor that collapses two reasons into one
   fails loudly instead of quietly re-hiding a population.
5. No change to any verdict, to the flagged rows, or to parity %. This story
   makes the loss visible; it does not shrink it.
