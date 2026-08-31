---
title: "corelib-spec-test-compare-enrollment"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
deps:
  ["vendor-ruby-spec-subset", "move-range-core-and-succ-to-corelib", "move-module-mixin-primitives"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0129-ruby-compat/ruby-spec-behavioural-enrollment"
---

## Context

**This is the story that gives `corelib` a stopping condition.** It is the point
of the RFC.

The four moved files carry **565 lines with zero anchor** today:
`range-ext.ts` (97), `core-ext/string/succ.ts` (112), `include.ts` (239),
`prepend.ts` (117). None has a Rails or gem counterpart, so
`scripts/api-compare/extra-surface.ts:12` — which walks _from each Ruby file_ to
its expected TS file — leaves them in the `rubyFile === null` slice
(`extra-surface.ts:531`): counted as extra surface, never compared. Two of them
carry `@noRailsEquivalent PERMANENT` tags (`range-ext.ts:19-22`, `succ.ts:6-8`)
that say so outright.

Enrolling the `ruby/spec` subset gives them a real, shrinking measure.

**`ruby/spec` enrolls in `parity:test` only — never `parity:api`, and that is
permanent.** `Module#include`/`#prepend` live in `eval.c`/`class.c` as
interpreter internals; `Range#include?` and `String#succ` in `range.c`/`string.c`.
There is no portable source to mirror method-by-method, only behavior.
Conflating the two contracts produces an enrollment that cannot pass. This is the
single most important thing to carry forward from this RFC — `compareApi: false`
here is not a flag a later story flips.

**Scope note:** the `date` gem's own `test/date/` enrollment is a _different_
story in a _different_ RFC (`date-test-compare-enrollment`, RFC
`0088-date-gem-port`). Do not enroll both here.

## Acceptance criteria

- [ ] `compareTests: true` for the `ruby_spec` source, scoped to
      `core/{module,range,string}`.
- [ ] `ruby_spec` keeps `compareApi: false`, with a comment at the registration
      site stating the reason (interpreter internals; behavior-only anchor) so it
      is not later "fixed".
- [ ] **Enrollment is 4 registrations, not 1** — a partial job reds CI with a
      fully green local compare (the assertion-mismatch mark). Enumerate and
      verify each before pushing.
- [ ] `pnpm parity:test` delta non-negative; the new baseline recorded.
- [ ] Deferred specs excluded via the documented mechanism with real reasons —
      not by deleting tests.
- [ ] The `@noRailsEquivalent PERMANENT` tags on `range-ext.ts` and `succ.ts` are
      **re-evaluated** now that a behavioral anchor exists. They may no longer be
      "permanent"; do not carry them forward unexamined.
- [ ] The RFC README updated with the starting match percentage, so the burndown
      has a baseline.
