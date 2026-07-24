---
title: "ar-resolve-type-name-unwired-attribute-path-adapter-blind"
status: claimed
updated: 2026-07-24
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T00:47:36Z"
assignee: "ar-resolve-type-name-unwired-attribute-path-adapter-blind"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Attributes::ClassMethods#resolve_type_name`
(vendor/rails/activerecord/lib/active_record/attributes.rb:296-298) overrides
ActiveModel's `AttributeRegistration::ClassMethods#resolve_type_name` for AR
models, so `attribute()` declarations resolve through
`Type.lookup(name, **options, adapter: Type.adapter_name_from(self))` — the
declaring model's adapter.

trails has both halves but they are not connected:

- `packages/activerecord/src/attributes.ts:336-344` — the AR version
  (adapter-aware since #5181) is a bare module-level function: not exported,
  never assigned onto `Base`, no call sites.
- `packages/activemodel/src/attribute-registration.ts:338-344` — the ActiveModel
  version, wired via `packages/activemodel/src/model.ts:315-320`
  (`static resolveTypeName`), is what actually runs. It does
  `typeRegistry.lookup(name)` and ignores its `_options` param entirely.

So every `attribute()` on every AR model resolves against ActiveModel's
`typeRegistry`, adapter-blind. #5181 fixed `Type.currentAdapterName` /
`Type.lookup` and unified the mysql2 registration key, but deliberately did not
wire this: it is a registry migration, not a one-line assignment. AR's
`AdapterSpecificRegistry` (13 types, adapter-scoped, options-object factories)
and ActiveModel's `typeRegistry` (AM built-ins + AR's date/datetime/time/text/
json overrides registered at type.ts's bottom, plus user registrations) have
different contents and different factory signatures. Other paths bypass
`resolveTypeName` altogether — e.g.
`packages/activemodel/src/attributes.ts:138` calls `typeRegistry.lookup`
directly — so a partial switch would split type resolution across two
registries.

## Acceptance criteria

- AR models resolve `attribute()` type names through the AR-specific
  `resolveTypeName`, i.e. `Base.resolveTypeName` is the activerecord version
  (module-mixin convention: `this`-typed function assigned onto the class, as
  `Base.aliasAttribute` is wired).
- Both registries agree, or the AR path consistently uses the AR registry:
  no name resolvable today via `typeRegistry` may become "Unknown type", and
  `attribute()` bypass paths (activemodel attributes.ts:138 and friends) are
  audited and routed the same way.
- Test: a model configured for a non-sqlite adapter declares `attribute()` with
  a name that has an adapter-specific registration, and the resolved type is the
  adapter-specific one — the test the #5181 reviewer asked for, which fails on
  today's main.
