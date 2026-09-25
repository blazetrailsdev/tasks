---
title: "preloader-and-join-dependency-are-not-autoload-namespaces"
status: draft
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
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

`ActiveRecord::Associations.eager_load!`
(`activerecord/lib/active_record/associations.rb:44-48`) is `super`, then
`Preloader.eager_load!` and `JoinDependency.eager_load!`. Both are
`extend ActiveSupport::Autoload` classes:

- `Preloader` (`associations/preloader.rb:47-54`) eager-autoloads
  `Association`, `Batch`, `Branch`, `ThroughAssociation`.
- `JoinDependency` (`associations/join_dependency.rb:6-11`) eager-autoloads
  `JoinBase`, `JoinAssociation`.

The `Associations` module's own `eager_autoload` block
(`associations.rb:29-41`) also lists `Preloader`, `JoinDependency`,
`AssociationScope` and `AliasTracker`, which trails'
`Associations` namespace (`packages/activerecord/src/namespaces.ts`) does not
autoload.

In trails, `Preloader` (`packages/activerecord/src/associations/preloader.ts`)
and `JoinDependency` (`associations/join-dependency.ts`) are plain classes. The
`Associations.eagerLoadBang` override in `associations.ts` therefore omits those
two calls under a `@missingRailsCall … — CONVERGEABLE` receipt pointing here.

The shape to follow is `Cipher` (`packages/activerecord/src/encryption/cipher.ts`):
a `declare namespace` merging the Autoload surface, `Object.defineProperty(K, "name", …)`
with the Ruby constant path, a `loadPath`, `extend(K, Autoload)`, and an
`eagerAutoload` block, each child seating itself on the class.

## Acceptance criteria

- `Preloader` and `JoinDependency` are extended with `Autoload` and eager-autoload
  the children Rails lists, each seated by its defining module.
- `Associations` eager-autoloads `Preloader`, `JoinDependency`, `AssociationScope`
  and `AliasTracker` as `associations.rb:29-41` does.
- `Associations.eagerLoadBang` calls `Preloader.eagerLoadBang()` and
  `JoinDependency.eagerLoadBang()`, and the `@missingRailsCall` receipts are removed.
- A plain-node import of the built `dist/associations/preloader.js` and
  `dist/associations/join-dependency.js` as entry modules does not TDZ.
