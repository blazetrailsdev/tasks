---
title: "Converge the Migration namespace object onto the ActiveRecord::Migration class (Compatibility autoload)"
status: ready
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 23
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration` is a class (`vendor/rails/activerecord/lib/active_record/migration.rb`), and
`Migration::Compatibility` is autoloaded on that class (`migration.rb:573`, `autoload :Compatibility`),
read at `migration.rb:629-631` and `schema.rb:72`.

trails has two objects for the one Rails constant: the `Migration` class (`packages/activerecord/src/migration.ts`,
seated as `ActiveRecord.Migration` since trails#8068) and a separate `Migration` namespace object in
`packages/activerecord/src/namespaces.ts` (`{ name: "ActiveRecord::Migration" }`, `extend(Migration, Autoload)`)
that exists only to autoload `Compatibility`. `migration.ts` and `schema.ts` import it as
`MigrationNamespace`, and `migration/compatibility.ts` seats `Migration.Compatibility = Compatibility`
on the namespace object, not the class. So `constantize("ActiveRecord::Migration::Compatibility")`
walks to the class and does not find `Compatibility`.

## Acceptance criteria

- `Compatibility` is autoloaded on and seated onto the `Migration` class itself (`extend(Migration, Autoload)`
  or equivalent), provided the TDZ cycle `V8_0 = Current` that motivated the split is still broken.
  Verify with plain-node `dist` entry imports of `migration.js`, `migration/compatibility.js` and `schema.js`.
- The `Migration` namespace object in `namespaces.ts` and the `MigrationNamespace` imports are deleted;
  CLAUDE.md § "Call-time constant resolution" updated.
- `constantize("ActiveRecord::Migration::Compatibility")` resolves.
