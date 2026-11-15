---
title: "extend-module-function-leak-lint"
status: draft
updated: 2026-11-15
rfc: "0189-activerecord-surfaced-deviations"
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

trails#10153 moved `ActiveModel::Naming` (`vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb:252-348`) and `Translation` (`translation.rb:21-25`) onto class modules. `extend()` (`packages/ruby-compat/lib/include.ts`, `extendObject`) copies a class module's prototype only, so its module functions (statics) never reach a host. A plain-object module still copies every own enumerable key. So a module that has `def self.x` members and is ported as a plain object, or a class without `[classModule]`, leaks those functions onto every host that extends it, and no check catches it.

`foldClassMethodsModules` in `scripts/parity/conventions.ts` already knows which Ruby members are module functions (`def self.x`) and which are instance methods.

## Acceptance criteria

- A `parity:api` check or lint rule fails when a TS module that `extend()` copies from carries a member whose Ruby counterpart is a module function (`def self.x`) on that module.
- It runs in CI. It is green on main once the existing instances are converged or filed.
- A fixture test shows it failing on a plain-object module that carries a `def self.x` port.
