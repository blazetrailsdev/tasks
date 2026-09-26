---
title: "Action callbacks carry an invented name: option (_trailsName) where Rails dedups and skips by the Symbol filter"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Callbacks` in trails keeps an invented `name:` option. It lives on `CallbackOptions.name` in `packages/actionpack/src/abstract-controller/callbacks.ts` and is stored on each AS callback as `options._trailsName`.

- `_registerActionCallback` uses it to delete an earlier callback of the same kind before it appends a new one.
- `_skipActionCallback` uses it to match a string filter.

Rails has no such option. `before_action :first` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb:231-235`) passes the Symbol straight to `set_callback`. Duplicate removal comes from `CallbackChain#append`'s `remove_duplicates` over `Callback#duplicates?` (`activesupport/lib/active_support/callbacks.rb`). That check is true only for a Symbol filter of the same kind. `skip_callback` (`callbacks.rb`, `__update_callbacks` / `chain.find { |c| c.matches?(type, filter) }`) matches the Symbol filter itself.

trails#8143 made string names dispatch as `":name"` (after/around) or as a `_wrapBefore(new MethodCall(name).makeLambda())` wrapper (before). It also sets `name` from the method name so that skipping by name keeps working. The side channel is still there, and callers still use it:

- `abstract-controller/callbacks.test.ts` `Callback2Overwrite` / `ChangedConditions`, which now pass a string name and no longer need it;
- `action-controller/base.ts` `protect_from_forgery`, which registers a function under `name: "verifyAuthenticityToken"` where Rails registers the Symbol `:verify_authenticity_token` (`request_forgery_protection.rb`);
- `trailties/src/generators/rails/authentication/templates.ts`, `requireAuthentication`.

## Converged shape

- Callers register the Rails Symbol: `beforeAction("verifyAuthenticityToken", …)`, with the method defined on the controller.
- `CallbackOptions.name` and `_trailsName` are deleted.
- `_skipActionCallback` for a string filter matches the chain entry whose filter is `":name"`. A before entry matches through the `MethodCall` its `_wrapBefore` wraps.
- The duplicate removal in `_registerActionCallback` is replaced by AS's `remove_duplicates`.
- `_registerActionCallback`'s second `_normalizeCallbackOptions` pass goes away, because `_insertCallbacks` already normalized the options. This mirrors `callbacks.rb:120-129`, where normalization happens once.

## Acceptance criteria

- `name:` is gone from `CallbackOptions`, and no `_trailsName` remains.
- `skipBeforeAction("verifyAuthenticityToken")` still removes forgery protection (trailties welcome/pwa controllers).
- The `callbacks_test.rb` / `filters_test.rb` ports stay green.
