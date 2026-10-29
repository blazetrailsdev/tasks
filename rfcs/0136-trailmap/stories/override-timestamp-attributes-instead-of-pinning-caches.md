---
title: "trailmap: override timestampAttributesForUpdate instead of pinning trails' private timestamp caches"
status: done
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#92
claim: "2026-10-29T12:51:28Z"
assignee: "loopback-only-guard-as-a-private-method-by-name"
blocked-by: null
closed-reason: null
---

## Context

trailmap's `app/models/timestamps.ts` (`pinTimestampColumns`, called from `app/models/story.ts:104` and `app/models/rfc.ts:57`) defines accessors over trails' private `_timestampAttributesForCreateInModel`, `_timestampAttributesForUpdateInModel` and `_allTimestampAttributesInModel` caches, so the update touch never writes the markdown date column `updated_on`. Its comment says trails does not consult a hook. That is no longer true: the vendored `@blazetrails/activerecord` `timestamp.js:19` builds the cache from `this.timestampAttributesForUpdate()` (trails `packages/activerecord/src/timestamp.ts:60-63`, `:95`), and `timestampAttributesForCreateInModel` (`:73-75`) reads `this.timestampAttributesForCreate()`. A model can override the statics as Rails does.

The Rails twin already does it the Rails way: `rails/app/models/story.rb:40-43` and `rails/app/models/rfc.rb:22-25` override `self.timestamp_attributes_for_update` to `["updated_at"]` (`activerecord/lib/active_record/timestamp.rb:96-98`), and `rails/test/models/model_methods_test.rb` pins that `updated_on` survives an update. The accessor pin reaches into framework internals, which trailmap's CLAUDE.md calls a framework bug in an application costume. Here the framework is already fixed, so the workaround is what is left over.

The TS pin also overrides the create columns (`created_at`, `updated_at`, which leaves out `created_on`). The Rails twin overrides only the update list. Check whether the create override is still needed: Rails' create touch only fills a timestamp column that is nil.

## Acceptance criteria

- `Story` and `Rfc` override `static timestampAttributesForUpdate()` (and `timestampAttributesForCreate()` only if the check above shows it is needed), and `app/models/timestamps.ts` is deleted.
- `test/models/timestamps.test.ts` still proves that an update leaves `updated_on` alone, including after a schema reload (`reloadSchemaFromCache`), which is the case the pin was written for.
- `rails/DEVIATIONS.md`'s "The timestamp touch" bullet is removed or rewritten, since the two apps then match.
