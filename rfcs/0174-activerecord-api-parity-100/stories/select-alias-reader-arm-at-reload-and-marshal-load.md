---
title: "activerecord: the select-alias reader arm at reload materializes the attribute set, and marshal_load's cannot be receipted"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8472. Rails reaches a select alias (`select("x AS y")`) through `method_missing`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:510-533`). Records are not
Proxies (CLAUDE.md), so trails defines a reader on the record's singleton class wherever a record
gets its attribute set. After trails#8472 that arm sits at four sites:

- `instantiateInstanceOf` (`packages/activerecord/src/persistence.ts`), over the row's keys, receipted with `@inventedArm`.
- `Core#initWith` (`packages/activerecord/src/core.ts`), over `attributes.keys()`, receipted.
- `marshalLoad` (`packages/activerecord/src/marshalling.ts`, Rails `marshalling.rb:43-56`), over the dumped hash's keys, **not receipted**: `parity:api:arms:throws` rejects a receipt there as STALE ("declaration not compared"), exported or not, because `marshalling.ts`'s functions reach the class through `Methods.include({...})` and are not a compared pair.
- `reload` (`packages/activerecord/src/persistence.ts:652`, Rails `persistence.rb:742-760`), over `this._attributes.keys()`, **not receipted**, and `LazyAttributeSet#keys` (`activemodel/lib/active_model/attribute_set/builder.rb:36-39`) builds an `Attribute` for every column of the model, which is the cost trails#8472 removed from the load path.

## Converged shape

One arm per site, each receipted where the gate can see it, and none that materializes the
attribute set. `reload` iterates the fresh record's row names (or reuses the singleton readers the
fresh object already has) rather than `keys()`. `marshalling.ts`'s `_marshalDump71` / `marshalLoad`
become a compared pair against `marshalling.rb`, so the arm in `marshalLoad` can carry its receipt.

## Acceptance criteria

- [ ] `parity:api` compares `marshalling.ts` `marshalLoad` against `marshalling.rb:43-56`, and its reader arm carries `@inventedArm` receipts the arm gate accepts.
- [ ] `reload` does not call `keys()` on a `LazyAttributeSet`; a test asserts the reloaded record's attribute set is not materialized.
- [ ] `reload`'s reader arm is receipted.
- [ ] The three `select-alias-reader.trails.test.ts` reload / marshal tests pass unchanged.
