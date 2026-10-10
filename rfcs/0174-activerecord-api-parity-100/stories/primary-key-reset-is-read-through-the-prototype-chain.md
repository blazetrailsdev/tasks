---
title: "activerecord: a subclass reads its parent's primary_key through the prototype chain"
status: claimed
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps:
  - active-record-base-inherited-chain-needs-one-deferred-dispatch
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-10T11:39:39Z"
assignee: "compatibility-module-members-unmeasured-by-parity-api"
blocked-by: null
closed-reason: null
---

## Context

`PrimaryKey::ClassMethods#inherited`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:143-150`)
resets a subclass's `@primary_key` to `PRIMARY_KEY_NOT_SET`, so `primary_key` (`:79-82`) calls
`reset_primary_key` (`:93-99`) for it: a base class derives its key with
`get_primary_key(base_name)`, and any other class takes `base_class.primary_key`. A key set on
an abstract parent, or on an intermediate class that is not the base class, is not inherited.

`packages/activerecord/src/attribute-methods/primary-key.ts` `getPrimaryKeyAttr` reads
`this._primaryKey` and returns it whenever it is not `undefined`. A static read walks the
prototype chain, so a subclass answers its parent's explicitly set key without reaching
`resetPrimaryKey`.

`packages/activerecord/CLAUDE.md` § "`inherited` is deferred to own-property memo guards" (repo
owner, 2026-10-09) settles the port of every `inherited` link under `ActiveRecord::Base`: an ivar
a link resets is answered only when it is an own property of the class being asked. The PR that closed
`active-record-base-inherited-chain-needs-one-deferred-dispatch` recorded the ruling and converged `lockingColumn` and `hasQueryConstraints`; `_primaryKey` is the
remaining reader that still walks the chain.

## Acceptance criteria

- [ ] `getPrimaryKeyAttr` answers `_primaryKey` only when it is an own property, and otherwise
      takes Rails' `reset_primary_key` path.
- [ ] A trails test covers a concrete subclass of an abstract class that sets `primaryKey`, and
      an STI leaf under an intermediate class that sets one, against the values Rails' body
      gives.
- [ ] The sentence naming this story in `packages/activerecord/CLAUDE.md` is deleted.
