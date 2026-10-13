---
title: 'require-table-teardown: follow a named migration class to the instance its migrate("down") reverts'
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: trails#8872
claim: "2026-10-13T21:05:22Z"
assignee: "activerecord-test-fixtures-vitest-surface-leaves-rails-file"
blocked-by: null
closed-reason: null
---

## Context

trails#8847 taught `blazetrails/require-table-teardown` (`eslint/require-table-teardown.mjs`) to accept
`migration.migrate("down")` in an `afterEach` / `afterAll` hook or a `finally` as the teardown of a table
created in that migration's `change()` (or `up()` with a `down()`), as Rails' migration tests tear down
(`vendor/rails/v8.0.2/activerecord/test/cases/migration/compatibility_test.rb:1079-1083`).

`instanceBinding` credits only a class instantiated where it is written:
`migration = new (class extends Migration.Current { … })()`. A named class instantiated elsewhere is not
followed:

```ts
class CreateWidgets extends Migration.Current {
  async change() {
    await this.createTable("widgets");
  }
}
const migration = new CreateWidgets();
afterEach(async () => {
  await migration.migrate("down");
});
```

That create is still reported as `missingTeardown`. Rails' tests use both shapes (`Class.new(migration_class) { … }.new`
and a named `class … < ActiveRecord::Migration`).

## Acceptance criteria

- [ ] A `new Name()` whose callee resolves to a class declaration (or a `const Name = class …`) in the
      same file binds that class's `change()` / `up()` creates to the instance variable.
- [ ] Cases in `eslint/require-table-teardown.test.mjs`: valid for the named class with a guarded revert;
      invalid when the instance reverted is of a different class.
