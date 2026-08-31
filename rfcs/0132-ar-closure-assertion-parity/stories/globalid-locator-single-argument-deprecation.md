---
title: "globalid-locator-single-argument-deprecation"
status: ready
updated: 2026-08-17
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GlobalID::Locator.locate` warns through `GlobalID.deprecator` when the
registered per-app locator defines `locate` with a single argument
(`vendor/globalid/lib/global_id/locator.rb:30-34`):

```ruby
if locator.method(:locate).arity == 1
  GlobalID.deprecator.warn "It seems your locator is defining the `locate` method only with one argument. ..."
  locator.locate(gid)
else
  locator.locate(gid, options.except(:only))
end
```

Trails' `Locator.locate` (`packages/globalid/src/locator.ts:250-268`) has
neither the arity branch nor the deprecation: it always calls
`locator.locate(parsed, rest)`.

The blocker is that JS `Function.length` is not Ruby `Method#arity`. Ruby
reports `-2` for `(gid, options = {})` and `1` for `(gid)`; JS `.length` stops
counting at the first defaulted parameter, so **both** shapes report `1`. A
literal port of the `arity == 1` test would fire the deprecation for every
correctly-written locator.

This surfaced as the one remaining assertion-count divergence after PR #6651
converged the globalid cluster: `global_locator_test.rb › use locator with
class and single argument` is `rails 3 vs trails 2`, because Rails' third
assertion is the `assert_deprecated(nil, GlobalID.deprecator)` wrapper
(`vendor/globalid/test/cases/global_locator_test.rb:305`) and trails has no
deprecation to assert. The reason is cited at the call site in
`packages/globalid/src/global-locator.test.ts`, and
`scripts/test-compare/assertion-mismatch-mark.json` holds globalid at
`assertionCount: 1`.

Deciding what trails should do here is the work: options include detecting the
one-argument shape some other way (a documented opt-in on the locator, or
`Function.length` plus a source check), adding a `GlobalID.deprecator` built on
`@blazetrails/activesupport`'s `Deprecation`, or ratifying the gap with a
`@missingRailsCall` at the call site — with the Rails citation for whichever is
chosen.

## Acceptance criteria

- `Locator.locate` either reproduces the locator.rb:30 arity branch (with a
  mechanism that does not misfire on `locate(gid, options = {})`) or carries a
  reviewed citation for why it cannot.
- `global_locator_test.rb › use locator with class and single argument` reports
  0 assertion-count mismatches, or the divergence is registered with a specific
  blocker.
- `scripts/test-compare/assertion-mismatch-mark.json` lowers globalid's
  `assertionCount` from 1 to 0 when the divergence is closed.
