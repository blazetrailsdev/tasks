---
title: "activerecord: Core's destroy_association_async_job instance reader comes from delegate ..., to: :class"
status: done
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8733
claim: "2026-10-09T22:39:42Z"
assignee: "relation-load-path-and-references-to-s-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8669, which made `delegate.call(proto, …, { to: "class" })` work on a class with no `class` accessor and converged `ModelSchema`'s `delegate :type_for_attribute, :column_for_attribute, to: :class`.

The other `to: :class` delegate in activerecord is `delegate :destroy_association_async_job, to: :class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:37`). `packages/activerecord/src/core.ts`
`Core[included]` writes it out by hand: an `Object.defineProperty(base.prototype, "destroyAssociationAsyncJob", { get })`
returning `this.constructor.destroyAssociationAsyncJob`.

It could not follow the same route in #8669. The class-level `destroyAssociationAsyncJob` is an accessor
property (a zero-arg Ruby reader, CLAUDE.md § "Generated attribute readers are properties"), and
`Delegation.generate` (`packages/activesupport/src/delegation.ts`) always defines a method-valued property,
so the delegated instance member would be `record.destroyAssociationAsyncJob()` where every reader today is
`record.destroyAssociationAsyncJob`.

## Acceptance criteria

- [ ] `Delegation.generate` defines an accessor when the delegated member on a known receiver class (`to: "class"`, or a module `to`) is an accessor property, with an activesupport test.
- [ ] `Core[included]` calls `delegate.call(base.prototype, "destroyAssociationAsyncJob", { to: "class" })` at Rails' site (`core.rb:37`) and the hand-written `defineProperty` is deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay green.
