---
title: "Request#controllerClassFor constantizes the controller instead of reading controllerConstants"
status: in-progress
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9389
claim: "2026-10-27T20:39:19Z"
assignee: "enumerable-free-functions-remaining-loop-and-enumerator-sites"
blocked-by: null
closed-reason: null
---

## Context

Rails `Request#controller_class_for` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:94-110`) builds `const_name` and calls `const_name.constantize`, raising `MissingController` only when the missing name is that constant. The trails port, `controllerClassFor` (`packages/actionpack/src/action-dispatch/http/request.ts:718-728`), reads a private `controllerConstants` Map keyed by the underscored param. It never resolves a constant, so tests have to seat routed controllers with `controllerConstants.set(...)`. For example, `dispatch/routing/ipv6-redirect.test.ts` (trails#8924) cannot use `registerConstant("BadRouteRequestController", …)`, the port of Rails' top-level `::BadRouteRequestController` (`ipv6_redirect_test.rb:10`).

## Acceptance criteria

- `controllerClassFor` resolves `${camelize(controllerParam)}Controller` through ruby-compat's constantize / registered constants, keeping Rails' `NameError` → `MissingController` arm (missing name equals `const_name`, or `const_name` starts with `"#{missing_name}::"`).
- `controllerConstants` is removed, and its `.set` call sites in tests become `registerConstant` with the Ruby constant name.
