---
title: "test-case-rb-included-mattr-and-helper-block-credit"
status: draft
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
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

`port-test-case-rb-remaining-members` took `test_case.rb` from 13 missing to 3.
It credited `attr_accessor :controller, :request, :output_buffer, :rendered`
(`vendor/rails/v8.0.2/actionview/lib/action_view/test_case.rb:63`) as the unset
slots of the `Behavior` object literal (`scripts/api-compare/extract-ts-api.ts`,
`isUnsetSlot`). It also ported `TestController`'s own
`attr_accessor :request, :response, :params` (`test_case.rb:19`) as accessor
overrides in `packages/actionview/src/test-case.ts`.

Three `ActionView::TestCase` names are still missing:

- `protect_against_forgery?`: defined inside `helper do ... end`
  (`test_case.rb:209-217`). The TS port defines `isProtectAgainstForgery` in an
  `Object.assign(helper, { ... })` inside the `this.helper(...)` callback
  (`test-case.ts`, `included` body). The TS extractor does not harvest an object
  literal inside a call argument, so nothing credits it.
- `debug_missing_translation` / `debug_missing_translation=`:
  `mattr_accessor :debug_missing_translation` sits in `TranslationHelper`'s
  `included do` block (`helpers/translation_helper.rb:17-19`), and Ruby's
  extractor attributes it to every includer, `TestCase` among them. In TS the
  call is `mattrAccessor.call(this, ...)` inside
  `TranslationHelper.included(null, function () { ... })`
  (`packages/actionview/src/helpers/translation-helper.ts:174-178`), and
  `creditAttribute` cannot resolve a `this` receiver, so the TS includer
  reports nothing. Compare `image_loading`, which credits as a move because
  `asset-tag-helper.ts` exports `setImageLoading`.

Both are credit gaps in `scripts/api-compare`, not missing behaviour.

## Acceptance criteria

- `creditAttribute` (or a sibling arm) credits a `mattrAccessor.call(this, ...)`
  inside a module's `included(...)` callback to the includers Rails' extractor
  marks `included: true`, or to the module, so the includer reads it as a move.
- The `helper do` block's methods are credited to `ActionView::TestCase`.
- `pnpm parity:api --package actionview` shows `test_case.rb` at 0 missing, and
  `parity:api:extra:gate` stays green.
