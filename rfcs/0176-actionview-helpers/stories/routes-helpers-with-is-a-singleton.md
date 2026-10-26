---
title: "RoutesHelpers.with is a non-enumerable singleton, as def self.with"
status: draft
updated: 2026-10-26
rfc: "0176-actionview-helpers"
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

Rails defines `AbstractController::Railties::RoutesHelpers.with` as a singleton method, `def self.with(routes, include_path_helpers = true)` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/railties/routes_helpers.rb:10`). In trails, `RoutesHelpers` (`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`) is a `defineModule({ with(...) {...} })` whose `with` is an enumerable public member. By the plain-object module rule in root CLAUDE.md, an enumerable member is an instance method, so `include()` would copy `with` onto includers. A singleton belongs as a non-enumerable own member. trails#9336 kept the shape it already had: `parity:api` credits it 1/1, and its body pin is green.

## Acceptance criteria

- `with` is a non-enumerable own member of `RoutesHelpers`, so its singleton status matches Rails, and `include()` no longer copies it onto includers.
- `scripts/api-compare/extract-ts-api.ts` credits it as a class/singleton method of the module, so `railties/routes_helpers.rb` stays 1/1 and the `railties/routes_helpers.rb:with` body pin stays green.
