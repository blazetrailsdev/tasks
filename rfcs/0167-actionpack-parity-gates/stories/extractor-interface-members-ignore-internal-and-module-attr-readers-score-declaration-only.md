---
title: "API extractor: own interface members ignore @internal, and a Module's attr_reader scores declaration-only"
status: draft
updated: 2026-10-02
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8380, which ported `ActionController::TestCase::Behavior` as a
live `Module` whose members are typed through `interface Behavior`
(`packages/actionpack/src/action-controller/test-case.ts`). Two extractor behaviours
in `scripts/api-compare/extract-ts-api.ts` forced shapes Rails does not have:

1. **An own interface member ignores `@internal`.** `extractInterface`'s member loop
   (`extract-ts-api.ts:4124-4152`) pushes every method and property signature as
   `visibility: "public"` and never calls `internalJsDocTagApplies`, although the
   heritage-clause arm above it does (`:4109`). On a class the same
   `/** @internal */ declare x` is dropped from the measured surface. Moving six
   `@internal` assertion helpers from the `TestCase` class onto its merged interface
   raised `parity:api:extra --package actioncontroller` for `test-case.ts` from 11
   moved names to 15, so the PR had to stop declaring them at all.
2. **A module's `attr_reader` has no bodied seat.** Every interface member is
   `bodyless`, and `declarationOnlyInFile` (`scripts/api-compare/compare.ts:1815`)
   scores a name with only a bodyless declaration as a miss. Rails'
   `attr_reader :response, :request`
   (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:377`) belongs
   to `Behavior`, but a module link cannot hold an instance data property, so the
   port kept `declare response` / `declare request` in the `TestCase` class body to
   hold `test_case.rb` at 60/60. `collectClassAttributeCalls` already credits
   `class_attribute`; there is no counterpart for `attr_reader` on a `Module`.

## Acceptance criteria

- An interface's own member tagged `@internal` is scored as a class member with the
  same tag is, including the `unbacked-internal-needs-receipt` yield.
- A Rails `attr_reader` / `attr_accessor` on a module ported as a live `Module` has a
  spelling the extractor credits as bodied, and `Behavior` uses it for `response` and
  `request`.
- `TestCase`'s class body in `action-controller/test-case.ts` drops the two `declare`
  fields and `test_case.rb` stays 60/60.
- Any count that moves in another package is explained in the PR.
