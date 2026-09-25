---
title: "Associations.eager_load! is an empty module function; ActiveRecord.eager_load! skips super/ConnectionAdapters"
status: claimed
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 28
pr: null
claim: "2026-09-25T22:47:03Z"
assignee: "canonical-schema-convert-remaining-t-references"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Associations.eager_load!` (`vendor/rails/activerecord/lib/active_record/associations.rb:44-48`)
is `super` (`ActiveSupport::Autoload#eager_load!`) then `Preloader.eager_load!` and
`JoinDependency.eager_load!`. trails' `packages/activerecord/src/associations.ts` still exports
`export async function eagerLoadBang(): Promise<void> {}`, an empty module function, while the
`Associations` namespace object in `packages/activerecord/src/namespaces.ts` already carries the
ported `Autoload#eagerLoadBang` (it is `extend(Associations, Autoload)` and eager-autoloads the
six association classes).

`ActiveRecord.eager_load!` (`vendor/rails/activerecord/lib/active_record.rb:499-507`) is `super`, then
`Locking`, `Scoping`, `Associations`, `AttributeMethods`, `ConnectionAdapters`, `Encryption`
`.eager_load!`. `packages/activerecord/src/active-record.ts` `eagerLoadBang` calls only the empty
Associations module function and (since trails#8094) `Encryption.eagerLoadBang()` off the namespace.
It omits `super` (the `ActiveRecord` namespace object's own Autoload eager load) and
`ConnectionAdapters.eager_load!`, both of which the namespaces now support.

Same shape as the encryption-eager-load-bang-is-an-empty-module-function convergence in trails#8094:
there `Encryption.eagerLoadBang` is installed with `Object.defineProperty` on the namespace
(extend copies accessors under vite-node), calling `Autoload.eagerLoadBang.call(this)` first.

## Acceptance criteria

- `Associations.eagerLoadBang` on the namespace runs the Autoload `super`, then
  `Preloader.eagerLoadBang()` / `JoinDependency.eagerLoadBang()` where those are Autoload namespaces
  (or a story is filed for making them so).
- The empty `eagerLoadBang` module function in `associations.ts` is deleted.
- `ActiveRecord.eagerLoadBang` calls the `ActiveRecord` namespace's Autoload eager load (`super`),
  then `ActiveRecord.Associations.eagerLoadBang()`, `ActiveRecord.ConnectionAdapters.eagerLoadBang()`
  and `ActiveRecord.Encryption.eagerLoadBang()` in Rails' order (Locking/Scoping/AttributeMethods as
  they become namespaces).
- `parity:api:calls`, `:args`, `:extra:gate` stay green.
