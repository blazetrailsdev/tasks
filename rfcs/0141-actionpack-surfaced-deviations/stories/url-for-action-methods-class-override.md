---
title: "AbstractController::UrlFor action_methods is a class override answering a Set"
status: draft
updated: 2026-11-06
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::UrlFor::ClassMethods#action_methods` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/url_for.rb:24-33`) overrides `action_methods`: `@action_methods ||= if _routes then super - _routes.named_routes.helper_names else super end`. It answers a Set.

trails' `packages/actionpack/src/abstract-controller/url-for.ts:34` exports a free `actionMethods(baseActionMethods: readonly string[], routes)` that takes and returns arrays. Only `url-for.test.ts` calls it, so it is not installed as the class override. Since trails#9758, `AbstractController.actionMethods` and Flash's override (`metal/flash.ts`) return a `ReadonlySet`.

## Acceptance criteria

- `UrlFor.ClassMethods.actionMethods` is a `this`-typed override reached through `rbCallSuper`, the shape `metal/flash.ts` uses. It answers `super` minus `helperNames()` as a Set and caches it in `_actionMethodCache`.
- `url-for.test.ts` asserts Sets.
