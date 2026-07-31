---
title: "Migration fixtures export a pre-built instance instead of only the class"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5762
claim: "2026-07-31T22:00:41Z"
assignee: "migration-fixtures-export-prebuilt-instance-not-class"
blocked-by: null
closed-reason: null
---

## Context

Every migration file under
`packages/activerecord/src/test-helpers/migrations/` ends with a pre-built
instance export:

```ts
export class AddExpressions extends Migration { ... }
export default new AddExpressions();
```

Rails' migration files define only the class; `MigrationProxy#load_migration`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1195-1199`) does
`load(...)` then `name.constantize.new(name, version)`. The instance is
constructed by the proxy, with the proxy's identity — never by the file.

PR #5525 added `loadMigrationFrom`, which prefers the named class export and
constructs `new Klass(name, version)`. The `default` export instance is now
only a fallback, kept so the 17 fixtures keep working. That fallback is the
last thing holding the deviation in place: a pre-built instance cannot carry
the proxy's name/version, which is exactly why the banner identity had to be
worked around before #5525.

## Acceptance criteria

- [ ] The `export default new Foo();` line is removed from the migration
      fixtures under `test-helpers/migrations/`, leaving the class export as
      Rails' migration files do.
- [ ] `loadMigrationFrom` drops the pre-built-instance fallback and always
      constructs `new Klass(name, version)`, mirroring `migration.rb:1195`.
- [ ] `migrator.test.ts`, `migration.test.ts` and `multi-db-migrator.test.ts`
      pass unchanged.
