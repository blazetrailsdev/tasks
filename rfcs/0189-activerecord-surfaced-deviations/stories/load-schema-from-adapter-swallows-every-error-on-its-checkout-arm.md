---
title: "activerecord: loadSchemaFromAdapter swallows every error on its checkout arm where load_schema re-raises"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ModelSchema#load_schema` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:534-546`)
re-raises every error `load_schema!` raises, after `reload_schema_from_cache`.

trails' awaited half, `loadSchemaFromAdapter` (`packages/activerecord/src/model-schema.ts`), has
two arms. With a leased connection it lets every error out. With none, it checks one out through
`pool.withConnection` and wraps the whole re-entrant call in `try { … } catch { return; }`, so a
failed checkout, a failed reflection query and a failed `loadSchemaBang` all vanish, and the model
is left unloaded. trails#8781 narrowed that only for a failed `verifyBang`, and receipted the
remaining `try` `@inventedArm try — CONVERGEABLE` against this story.

Removing the `catch` outright was tried on trails#8781. Two tests went red, each a defect the
swallow had been hiding:

- `packages/activerecord/src/sti-attribute-routing.trails.test.ts`, "subclass attribute survives
  the subclass's own schema reflection (end-to-end)": the schema-cache double has no
  `getCachedPrimaryKeys`, so `resetPrimaryKey` raises
  `TypeError: this._schemaReflection.loadedCache?.getCachedPrimaryKeys is not a function`.
  Adding `getCachedPrimaryKeys` / `getCachedDataSourceExists` to the double fixes it.
- `packages/activerecord/src/attribute-methods/time-zone-conversion.trails.test.ts`, "wraps
  schema-reflected datetime column when timeZoneAwareAttributes is true": after about 10 s it
  raises `ActiveRecordError: Cannot lease connection, it is already leased by the current thread`
  from `ConnectionPool#tryToCheckoutNewConnection` inside `withConnection`. It fails when run
  alone, and still fails with the double completed as above. Not root-caused: the double is
  handed out by `dbConfig.newConnection` on every call (`test-helpers/adapter-double.ts`), so a
  second checkout while it is leased gets the same leased object.

Only ~110 activerecord test files were sampled on SQLite; the rest of the suite and the
PostgreSQL / MariaDB lanes were not run with the `catch` removed.

## Acceptance criteria

- [ ] The time-zone test's checkout failure is root-caused and fixed at its cause.
- [ ] `loadSchemaFromAdapter`'s no-leased-connection arm has no `try` / `catch`: an error from the checkout, the reflection or `loadSchemaBang` reaches the caller, as `model_schema.rb:534-546` re-raises it. The `@inventedArm try` receipt and the `verifying` flag are deleted.
- [ ] Whether a class with no connection pool still returns quietly is decided against Rails (`connection_pool` raises `ConnectionNotEstablished`) and stated in the PR body.
- [ ] Every test the removal reddens is fixed at its double or its setup, not by restoring the swallow.
