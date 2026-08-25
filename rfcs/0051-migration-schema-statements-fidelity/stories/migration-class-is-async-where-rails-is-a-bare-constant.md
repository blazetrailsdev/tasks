---
title: "DatabaseTasks.migrationClass is async, so its own sync readers route around it to _baseClass!"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6220
claim: "2026-08-08T02:27:56Z"
assignee: "migration-class-is-async-where-rails-is-a-bare-constant"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `DatabaseTasks.migrationConnection` /
`migrationConnectionPool` in PR #6214.

Rails (`activerecord/lib/active_record/tasks/database_tasks.rb:529-531`):

```ruby
def migration_class # :nodoc:
  ActiveRecord::Base
end
```

A bare constant reader — synchronous, and the receiver every sibling method
delegates through (`migration_connection` at `:533-535`,
`migration_connection_pool` at `:537-539`, `with_temporary_pool` at `:543`).

trails (`packages/activerecord/src/tasks/database-tasks.ts`) spells it
`static async migrationClass(): Promise<typeof Base>` — it `await import(
"../base.js")`s to stay out of the module cycle base.ts↔database-tasks.ts.
Because it is async, the two sync readers PR #6214 converged cannot use it:
`migrationConnection()` and `migrationConnectionPool()` both name the
`_baseClass!` registry field instead — the same constant, wired at base.ts
module init by `_registerBase`, but reached by a non-null assertion on a
private cache rather than by the Rails-named method.

So `migrationClass` is now the odd one out: the Rails-named accessor exists but
its own siblings route around it.

## Converged shape

`migrationClass()` becomes synchronous and returns `Base`, matching
`database_tasks.rb:529-531`, with `migrationConnection` /
`migrationConnectionPool` / `withTemporaryPool` delegating through it rather
than through `_baseClass!`. The zero-import slot module
(`CLAUDE.md` § "Call-time constant resolution") is the settled trails idiom for
exactly this: a file with no runtime imports exporting a mutable `Base` binding
plus a `_setBase()` setter that base.ts calls at the bottom of its own body —
which is what `_registerBase` already half-is. Fold `_baseClass` into that shape
so the sync read is legitimate rather than an assertion, and delete the `!`.

Verify the cycle both directions with a plain-node import of the **built**
`dist/**.js` modules as entry modules; a vitest run enters the funnel module
first and masks a TDZ.

## Acceptance criteria

- [ ] `DatabaseTasks.migrationClass()` is synchronous and returns `Base`.
- [ ] `migrationConnection`, `migrationConnectionPool` and `withTemporaryPool`
      delegate through `migrationClass()`, not `_baseClass!`.
- [ ] No `!` assertion on the Base registry survives in database-tasks.ts.
- [ ] `dist` entry-module import of base.js and tasks/database-tasks.js, in
      either order, does not throw a TDZ error.
