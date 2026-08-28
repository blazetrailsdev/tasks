---
title: "Join Timestamp's reload_schema_from_cache to the override chain — the body exists but nothing calls it"
status: claimed
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 10
pr: null
claim: "2026-08-28T19:57:42Z"
assignee: "timestamp-reload-schema-from-cache-is-never-dispatched"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Timestamp::ClassMethods#reload_schema_from_cache`
(`vendor/rails/activerecord/lib/active_record/timestamp.rb:88-93`) nils the
three timestamp-attribute memos and then calls `super`, so it sits in the same
override chain as `ActiveRecord::Attributes`' (`attributes.rb:268-271`) and
`ModelSchema`'s (`model_schema.rb:553-571`).

trails has the body — `reloadSchemaFromCache` in
`packages/activerecord/src/timestamp.ts:413-417` — but nothing calls it and
nothing seats it on `Base`. PR #7176 made every caller reach the chain by
dispatch (`this.reloadSchemaFromCache()`), and `base.ts` seats only the
`attributes.ts` override, so the Timestamp half is dead code: a schema reload
leaves `_timestampAttributesForCreateInModel` / `...ForUpdateInModel` /
`_allTimestampAttributesInModel` stale.

Rails' chain, innermost last:
`Timestamp` → `Attributes` → `ModelSchema`.

## Converged shape

`timestamp.ts`'s `reloadSchemaFromCache` joins the override chain at the
timestamp.rb seat in `base.ts`, calling the `attributes.ts` half as its `super`
the way `attributes.ts` calls `model-schema.ts`'s. Whichever override `Base`
carries is the one dispatch reaches, so the ordering has to be established
where the includes are, not by import.

A regression test drives a reload on a model with timestamps and asserts the
memos are dropped — it fails on baseline, where nothing calls the body.

## Acceptance criteria

- [ ] `timestamp.ts`'s `reloadSchemaFromCache` is reached by
      `this.reloadSchemaFromCache()` on an AR class, ahead of the
      `attributes.ts` override, mirroring timestamp.rb:88-93's `super`.
- [ ] A test asserts the timestamp memos are cleared by a schema reload.
- [ ] activerecord suite green on all three adapter lanes.
