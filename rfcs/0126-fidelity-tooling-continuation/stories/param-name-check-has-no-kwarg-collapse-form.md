---
title: "Parameter-name check has no Ruby kwarg-collapse candidate form"
status: ready
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`compareParamNames` (`scripts/api-compare/param-names.ts:122-148`) compares the
Ruby parameter list — kwargs included, one slot each — against the TS candidate
forms in `tsForms`, which only strip a leading receiver and a trailing callback.
There is no Ruby-side form that collapses a kwarg group into the single options
object trails ports it as, even though `arity.ts` already has exactly that
concept in `collapseKeywordsIntoOptionsObject`
(`scripts/api-compare/arity.ts:269-273`).

So a Rails method with TWO optional kwargs and a leading explicit receiver
cannot align on the honest reading. `secure_password.rb:116`
(`has_secure_password(attribute = :password, validations: true, reset_token: true)`)
is the worked example: Ruby is 3 slots, the port was
`(modelClass, attribute, options)`, the receiver-stripped form is 2 slots and
does not align, so the 3-slot form wins and reports `attribute → modelClass`
and `validations → attribute` — two rows for a correctly-ported signature.
PR #7172 cleared them by flipping `hasSecurePassword` to a `this`-typed receiver
(the CLAUDE.md "Module mixins" idiom), which is a good change on its own but was
forced by the measurement rather than by fidelity.

`collapseKeywordsIntoOptionsObject` does not help here because it requires ≥2
REQUIRED kwargs; arity covers the optional case through `hasKeywords` slack
instead, which the name check has no analogue for.

## Converged shape

Add a Ruby-side candidate form to `compareParamNames` / `matchParamNamesAgainst`
that collapses a trailing kwarg group (required OR optional) into one
`options` slot, tried alongside the as-declared list, exactly as `arityMatches`
tries `rubyForms`. As with every other strip, it can only ever GAIN a match, so
it cannot hide a real rename.

## Acceptance criteria

- A Rails signature with ≥1 kwarg aligns against a TS `(…, options)` port under
  the collapsed Ruby form, with the receiver strip applied.
- `pnpm parity:api --params` totals do not increase for any package; arel and
  activemodel stay at 0 and `pnpm parity:api:params` stays OK.
- `scripts/api-compare/param-names.test.ts` covers the collapsed form, including
  that it does not mask a genuine rename at a non-kwarg position.
