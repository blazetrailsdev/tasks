---
title: "activerecord: a record built against a cold schema cache saves a row and gets no id"
status: draft
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while removing `ensureSchemaLoaded()` from `Persistence#save` in trails#8626 (`packages/activerecord/src/persistence.ts`; Rails' `save` layers make no such call: `vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:390-394`, `validations.rb:47-49`, `transactions.rb:360-362`, `suppressor.rb:51-53`).

A record built with `new` against a cold schema cache has no column attributes (CLAUDE.md § "Schema reflection peeks at a warm cache": `loadSchemaFromCacheSync` returns `false` and leaves the model unloaded). Saving that record misbehaves on either side of the change:

- Before trails#8626, `save` awaited `ensureSchemaLoaded()` first. The class loaded, the record's attribute set stayed the cold one, and `save` raised "can't write unknown attribute created_at" from the timestamp write.
- After it, `save` returns `true`, an all-defaults row is inserted, and the record's `id` stays unset.

Reproduction (canonical schema, `fixtures([])`):

    class Topic extends Base {}
    Base.connectionPool().schemaCache.clearBang();
    const topic = new Topic();
    await topic.save();   // true
    topic.id;             // undefined

In Rails `Topic.new` reflects the table in line (`model_schema.rb:587-597`), so the record always has its columns. Validations on a cold-built record do run and report correctly; trails#8626 pins that in `persistence-save-cold-schema.trails.test.ts`.

## Acceptance criteria

- [ ] A record built before its model's schema is loaded either gets its column attributes once the schema is warm, or its first persistence call fails loudly naming the cold schema. It never inserts a row and returns `true` without an `id`.
- [ ] The reproduction above is a test, on SQLite, PG and MySQL.
