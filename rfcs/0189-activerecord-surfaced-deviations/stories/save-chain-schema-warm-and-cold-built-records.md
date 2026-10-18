---
title: "activerecord: the save chain's schema warm and records built against a cold schema cache"
status: ready
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 23
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while layering `save` in trails#8626. Rails' four `save` layers make no schema call (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:390-394`, `validations.rb:47-49`, `transactions.rb:360-362`, `suppressor.rb:51-53`), because `Topic.new` has already reflected the table in line (`model_schema.rb:587-597`).

trails' `save` / `saveBang` chain in `packages/activerecord/src/base.ts` awaits `ensureSchemaLoaded()` between the Suppressor and Transactions layers. trails#8626 moved that call out of the `Persistence#save` body but could not delete it: without it `adapters/postgresql/enum.test.ts` "assigning enum to nil" (a record built with `new` before its model's schema is loaded) saves a row and leaves `id` unset, so `reload` raises `RecordNotFound`.

The warm is also not enough. A record built against a truly cold schema cache keeps its cold attribute set after the class loads:

    class Bird extends Base {}
    Base.connectionPool().schemaCache.clearBang();
    const bird = new Bird();
    await bird.save();   // raises "can't write unknown attribute id"

and the same on a timestamped table raises for `created_at`. Validations on such a record do run; trails#8626 pins that in `persistence-save-cold-schema.trails.test.ts`.

CLAUDE.md § "Schema reflection peeks at a warm cache" makes a cold `new` leave the model unloaded and names warming as an explicit async step.

trails#8774 gave such a record its column attributes on the first `_attributes` read after the class loads: `Core`'s constructor calls the module-private `completeAttributesOnSchemaLoad` (`packages/activerecord/src/core.ts`), which installs an own `_attributes` accessor on a record built while `isSchemaLoaded` is false. Rails has no counterpart, since `_default_attributes` loads the schema in line (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:472`, `model_schema.rb:587-597`). The call carries `@inventedArm completeAttributesOnSchemaLoad — CONVERGEABLE save-chain-schema-warm-and-cold-built-records` on `constructor`; this story owns it.

## Acceptance criteria

- [ ] A record built before its model's schema is loaded either gets its column attributes once the schema is warm, or its first persistence call fails loudly naming the cold schema.
- [ ] The `ensureSchemaLoaded()` await in `base.ts`'s `save` / `saveBang` chain is gone, or carries a receipt against the CLAUDE.md section.
- [ ] The reproduction above is a test, on SQLite, PG and MySQL, and `adapters/postgresql/enum.test.ts` stays green.
- [ ] `completeAttributesOnSchemaLoad` and its receipt on `Core`'s `constructor` are gone: either a cold `new` can no longer leave a record without its columns, or the repo owner rules the accessor permanent and the receipt says `PERMANENT` against a CLAUDE.md section.
