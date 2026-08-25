---
title: "parity:api:calls treats object-literal keys as ported methods, so a DEFAULT_BEHAVIORS :raise key reds 67 files"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6656
claim: "2026-08-17T16:57:56Z"
assignee: "extractor-object-literal-keys-are-not-ported-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6279, which cost roughly an hour of bisection.

`significantMissingCalls` (`scripts/api-compare/compare.ts:300-360`) flags a
Ruby call only when its mapped TS candidate `isPortedWithArgs`. The TS
extractor counts an **object-literal property whose value is a function** as a
ported member, so introducing a literal with a `raise:` key anywhere in a
package makes `isPortedWithArgs("raise")` true and turns every Rails `raise` in
that package into a fresh call-mismatch row.

Concretely: porting `ActiveSupport::Deprecation::DEFAULT_BEHAVIORS`
(`activesupport/lib/active_support/deprecation/behaviors.rb:13-63`) as the
object literal it is in Ruby produced **67 new activesupport rows**, none of
them in a file the PR touched. The symptom is maximally confusing — the ratchet
names 67 unrelated files and no diff explains them.

PR #6279 worked around it by spelling `DEFAULT_BEHAVIORS` as a `Map`, with the
reason recorded at the definition. That is a deviation the port should not have
to carry: a Ruby Hash's natural TS spelling is an object literal, and the next
Hash with a `raise` / `send` / `new` key will hit the same wall.

## Converged shape

The extractor does not count a plain object-literal property as a ported
method. Rails' method table constants are data, not a method surface; a Ruby
Hash key is a Symbol, and no Ruby caller invokes it as a method. Once the
extractor agrees, `DEFAULT_BEHAVIORS` reverts to an object literal and its
`Map` justification is deleted.

## Acceptance criteria

- [ ] An object literal with a function-valued `raise` key in a Rails-matched
      file does not make `isPortedWithArgs("raise")` true.
- [ ] A regression test in `scripts/api-compare/` covers it and fails on
      baseline.
- [ ] `DEFAULT_BEHAVIORS` (`packages/activesupport/src/deprecation.ts`) is an
      object literal again and its `Map` paragraph is removed.
- [ ] `pnpm parity:api:calls` green with no baseline additions.

## Re-verified 2026-08-17 (draft sweep)

Still valid, and the deviation is still being carried: `DEFAULT_BEHAVIORS` at
`packages/activesupport/src/deprecation.ts:49` is still spelled
`ReadonlyMap<DeprecationBehavior, DeprecationBehaviorCallable>` rather than the
object literal the Ruby Hash naturally maps to. `significantMissingCalls` has
moved from `compare.ts:300-360` to **`compare.ts:403`** — refresh that citation.

_Moved from RFC 0025 in the 2026-08-17 scoping split: RFC 0025 had grown to 262
stories. This story is a call-gate **false positive** — the tool reports a
mismatch where the port is faithful — which is the whole scope of the new RFC._
