---
title: "base-attribute-override-is-invented-ar-surface"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ActiveRecord defines no `attribute` of its own. It includes
`ActiveModel::AttributeRegistration` (`activerecord/lib/active_record/attributes.rb:9`)
and says so explicitly — "Implemented by ActiveModel::AttributeRegistration#attribute"
(`:213`) — whose body registers a pending type and stops
(`activemodel/lib/active_model/attribute_registration.rb`).

trails has a `Base.attribute` override
(`packages/activerecord/src/base.ts:862`) carrying four things Rails does not:

- `_initializeGeneratedModules.call(this)` when `_generatedAttributeMethods` is
  not an own property — Rails initializes generated modules from `inherited`
  (`activerecord/lib/active_record/core.rb`), not from a declaration.
- `ModelSchema.clearAttributeNamesMemo(this)` — Rails' `attribute_names` reads
  `attribute_types.keys` (`activemodel/lib/active_model/attributes.rb:74`) with
  no memo to clear.
- `delete this.prototype.id` when the attribute is named `id` and the prototype
  answers it.
- `encryptionHooks.applyPendingEncryptions(this)` — Rails applies encryption
  from `encrypts` (`activerecord/lib/active_record/encryption/encryptable_record.rb`),
  not from `attribute`.

plus a kwargs shuffle that moves `typeName` into `options` when it is neither a
string nor a `Type`.

The eager `defineAttributeMethod(name)` that used to sit here was removed by
trails#7436, so the override's remaining reason to exist is these four hooks.
Each is a trails wiring concern that Rails satisfies elsewhere, which is what
makes this an extra public AR name with no Ruby counterpart.

## Converged shape

`Base.attribute` is deleted and AR inherits `AttributeRegistration`'s
`attribute` unchanged, as `attributes.rb:9,213` says it does. Each hook moves to
the Rails seat that owns it:

- generated-module initialization to the `inherited` path,
- the `attribute_names` memo invalidation to wherever `attributeTypes` is
  written (or the memo is dropped, since Rails has none),
- the `id` prototype delete to the reader-generation guard that already refuses
  to shadow an inherited method (see CLAUDE.md, "Generated attribute readers are
  properties"),
- pending encryption to the `encrypts` path.

The kwargs shuffle belongs in `AttributeRegistration::ClassMethods#attribute`
itself, which is where Ruby's `attribute(name, cast_type = nil, **options)`
resolves the same ambiguity.

## Acceptance criteria

- [ ] `packages/activerecord/src/base.ts` defines no `attribute`; AR resolves
      `AttributeRegistration`'s.
- [ ] Declaring `attribute("id", ...)` on a model still does not leave a
      shadowing prototype `id`.
- [ ] `encrypts` applies pending encryptions without an `attribute` call.
- [ ] `pnpm parity:api:extra:gate` measures one fewer novel activerecord name;
      tighten the mark with `pnpm parity:api:extra:tighten`.
