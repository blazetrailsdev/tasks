---
title: "Call gates skip a method recorded under both a class and its synthesized mixin entity"
status: draft
updated: 2026-10-02
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8380.

On `main` before that PR, `ActionController::TestCase#controllerClassName` was a
class method. `ts-api.json` recorded it twice with the same body and line: once
under the class `TestCase`, once under the entity the extractor synthesizes for a
class that merges an interface (`name: "TestCase__mixin"`, `synthesizedMixin: true`,
`scripts/api-compare/extract-ts-api.ts:1066-1076`). Its body calls
`isAnonymous(klass)` where Rails calls `@controller.class.anonymous?`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:553`), and
neither call gate reported that site.

Once the PR made the body a single module function, `parity:api:calls:args`
reported the row at once. The reading is that the call-argument loop's
`resolveOwner` answered `ambiguous` for the two owners and returned before pairing
any site (`scripts/api-compare/compare.ts`, the `if (ambiguous) return;` ahead of
`ownerCallArgSites`). That reading was inferred from the two identical
`ts-api.json` entries and the gate's before/after behaviour; `resolveOwner` was not
instrumented.

`call-args-gate-skips-twice-declared-bodies` (RFC 0108, done) fixed the
function-plus-grouping-object form of the same hole. This is the
class-plus-synthesized-mixin form, and it applies to every class in the repo that
merges an interface: their bodies may be uncompared by both call gates.

## Acceptance criteria

- Confirm or refute the cause by instrumenting `resolveOwner` for a class that
  merges an interface.
- A method recorded under a class and its synthesized mixin entity resolves to the
  class, and both call gates compare its sites.
- The rows this un-hides are counted per package in the PR, and are fixed, receipted
  or baselined with a real reason under the existing only-shrink rules.
