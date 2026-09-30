---
title: "AbstractController::Rendering#_normalize_args permitted? arm never fires for a real Parameters (rendering.rb:66-77)"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Rendering#_normalize_args` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/rendering.rb:66-77`) does `if action.respond_to?(:permitted?)`, then returns `action` if `action.permitted?` and otherwise raises `ArgumentError, "render parameters are not permitted"`.

trails' port (`packages/actionpack/src/abstract-controller/rendering.ts`, `_normalizeArgs`) tests `typeof action.permitted === "function"`. But `ActionController::Parameters` exposes `permitted` as a getter (`packages/actionpack/src/action-controller/metal/strong-parameters.ts`, `get permitted()`), so a real `Parameters` never enters that arm. An unpermitted `Parameters` is returned by the Hash-shaped arm instead of raising. `abstract-controller/rendering.test.ts` only passes `{ permitted: () => true }` doubles, so nothing catches this. trails#8266 ported `ActionView::Rendering#_normalize_args`' permitted arm (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:164`) as `rbObjRespondTo(action, "permitted") && action.permitted`, which reads the getter.

## Acceptance criteria

- The abstract `_normalizeArgs` tests `rbObjRespondTo(action, "permitted")` and reads trails' `permitted` getter, as the ActionView port does, in the `rendering.rb:66-77` arm order.
- `render(unpermittedParams)` raises `ArgumentError` "render parameters are not permitted" with a real `ActionController::Parameters`, and a permitted one is returned as the options.
- The test doubles in `abstract-controller/rendering.test.ts` use the getter shape.
