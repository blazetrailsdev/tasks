---
title: "activerecord: port Associations.eager_load!"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` scores activerecord at **6789/6847**. `associations.rb → associations.ts` misses
`ActiveRecord::Associations.eager_load!` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations.rb:44`): `super` (the
`ActiveSupport::Autoload#eager_load!` over the `eager_autoload` block at `associations.rb:15-41`) then
`Preloader.eager_load!` and `JoinDependency.eager_load!`. `packages/activerecord/src/namespaces.ts`
already extends `Associations` with `ActiveSupport::Autoload` (CLAUDE.md § "Call-time constant
resolution"), and `Encryption.eagerLoadBang` shows the settled shape.

## Acceptance criteria

- [ ] `Associations.eagerLoadBang` is ported on the `Associations` namespace with Rails' body and order.
- [ ] `pnpm parity:api` activerecord misses −1; a test proves every `eager_autoload` constant is seated after the call.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
