---
title: "trails-tsc: collect helperMethod names only from class-level macro positions"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`exposedHelperMethods` (`packages/trails-tsc/src/build-views.ts`, PR #8296) collects string-literal arguments of any call named `helperMethod` anywhere inside the controller class, its app superclasses, and the modules they `include(...)`. That includes calls inside unrelated instance-method bodies.

It also never looks outside the class declaration, so a module-level `PostsController.helperMethod("x")` after the class is missed.

Rails' `helper_method` is a class-level macro (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:128-142`). It runs at class-body or `included do` time and registers the names on that class's `_helpers`.

## Converged shape

Only calls in class-level positions count:

- `static {}` blocks and static field initializers of the class and its app superclasses;
- the `included` hook of each module the class `include(...)`s, as the authentication generator emits it (`packages/trailties/src/generators/rails/authentication/templates.ts:88`);
- top-level statements in the class's own file whose receiver resolves, through the checker, to that class (`X.helperMethod(...)`).

Calls inside instance-method bodies are ignored.

## Acceptance criteria

- [ ] `helperMethod("x")` inside an instance method does not expose `x`.
- [ ] `PostsController.helperMethod("x")` after the class declaration exposes `x`.
- [ ] Tests in `packages/trails-tsc/src/build-views.test.ts`.
