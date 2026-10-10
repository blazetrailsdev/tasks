---
title: "abstract-controller/translation.test.ts carries Rails names over invented bodies"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
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

Surfaced by trails#8755, which converged `AbstractController::Translation#translate`
(`packages/actionpack/src/abstract-controller/translation.ts`) onto
`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/translation.rb:17-32` and left its test
file alone.

`packages/actionpack/src/abstract-controller/translation.test.ts` carries the names of
`vendor/rails/v8.0.2/actionpack/test/abstract/translation_test.rb` over bodies that differ from it:

- The fixture is a hand-written `TranslationController` class with a static `controllerPath` and
  four forwarding methods. Rails' is `class TranslationController < AbstractController::Base;
include AbstractController::Translation; end` (`translation_test.rb:7-9`), and each test stubs
  `action_name` (`@controller.stub :action_name, :index do`).
- `expect(...)` matchers stand where Rails has `assert_respond_to`, `assert_raise`, `assert_equal`.
- Assertions are missing: "translate escapes interpolations in translations with a html suffix"
  drops the `word_struct` half (`:144-155`); "translate marks translation with missing nested html
  key as safe html" drops the `assert_equal` on the "Translation missing. Options considered
  were:" message (`:168-178`), which the converged body now produces.
- "lazy lookup with symbol" and "lazy lookup fallback" pass `".foo"` where Rails passes the Symbol
  `:'.foo'` (`:67-77`); the Symbol spelling is `":.foo"`.
- Two tests with no Rails counterpart sit inside the mirrored `describe`: "dot-prefixed lookup with
  raise: true still honors the user default chain" and "raises when raise: true and the whole
  chain (scoped + fallback + defaults-as-keys) misses". The second `describe` in the file is
  trails-only as a whole.

`scripts/test-compare/assertion-mismatch-mark.json` holds `abstractcontroller` at assertionCount 5,
kind 18.

## Acceptance criteria

- [ ] `TranslationControllerTest` is rewritten from `translation_test.rb`: the same `setup`, the
      same statements and the same assertions per test, on a controller that includes the
      `Translation` module.
- [ ] Every test with no Rails counterpart moves to `translation.trails.test.ts`.
- [ ] A test whose Rails assertions fail against the port is parked `it.skip` under a `BLOCKED:`
      line naming a filed story, with the Rails body kept.
- [ ] `pnpm parity:test:assertions` stays green and the `abstractcontroller` mark is lowered to the
      new counts.
