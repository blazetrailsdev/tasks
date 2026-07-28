---
title: "Migrator loads the migration outside the all-later-migrations-canceled rescue"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migrator#_runMigration` (`packages/activerecord/src/migration.ts`) loads the
migration before the `try` that produces Rails' cancellation message:

```ts
const loaded = await proxy.migration();   // outside the try
try {
  await this._ddlTransaction(migration, async () => { ... });
} catch (e) {
  const msg = `An error has occurred, ${useTx ? "this and " : ""}all later migrations canceled:...`;
}
```

Rails puts the load inside the rescue. `execute_migration_in_transaction`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1528-1543`) calls
`migration.migrate(@direction)`, and `MigrationProxy` resolves `migration`
lazily through `load_migration` (`migration.rb:1191-1200`) at that moment — so
a migration file that fails to load (syntax error, bad constant, throwing
module top-level) is wrapped in `StandardError, "An error has occurred, this
and all later migrations canceled: ..."` with the original backtrace.

In trails that failure escapes raw, so the operator loses both the
"all later migrations canceled" framing and the `use_transaction?` detail.

Predates PR #5525 — that PR preserved the existing structure while collapsing
the banner duplication.

## Acceptance criteria

- [ ] A migration whose `proxy.migration()` factory rejects produces the same
      `An error has occurred, ... all later migrations canceled:` error as a
      migration that fails during `up`/`down`, matching `migration.rb:1538-1543`.
- [ ] The original error is preserved as the cause, as it is for run failures.
- [ ] A regression test covers a rejecting migration factory and is verified to
      fail before the fix.
