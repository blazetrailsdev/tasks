---
title: "helper_method is a free function, so Cookies' defined?(helper_method) guard is unportable and API omits Cookies"
status: draft
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8165. `ActionController::Cookies`' included block is `helper_method :cookies if defined?(helper_method)` (`action_controller/metal/cookies.rb:9-11`). The guard exists because `ActionController::API` includes `Cookies` without `AbstractController::Helpers` (`action_controller/api.rb`).

In trails `helper_method` is the free function `helperMethod(klass, ...)` (`packages/actionpack/src/abstract-controller/helpers.ts:61`), not a class method that `AbstractController::Helpers::ClassMethods` adds. So nothing answers `defined?`. `metal/cookies.ts` calls it unconditionally, and `Cookies` is included into `Base` only, not into `API` as `api.rb` does.

## Acceptance criteria

- `helperMethod` is a class method of the classes that include `AbstractController::Helpers` (`abstract_controller/helpers.rb`, `ClassMethods#helper_method`), so `rbObjRespondTo(klass, "helperMethod")` answers `defined?`.
- `Cookies[included]` guards on it as `cookies.rb:10` does.
- `API` includes `Cookies`, as `api.rb`'s `MODULES` list does.
