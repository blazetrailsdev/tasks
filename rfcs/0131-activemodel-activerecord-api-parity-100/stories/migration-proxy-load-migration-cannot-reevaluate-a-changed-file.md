---
title: "MigrationProxy#loadMigration drops Rails' remove_const, so a changed migration file never re-evaluates"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 9
pr: 7447
claim: "2026-09-03T15:54:31Z"
assignee: "move-remaining-transaction-manager-delegates-to-database-statements"
blocked-by: null
closed-reason: null
---

## Context

Rails' `MigrationProxy#load_migration`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1194-1198`) is:

    def load_migration
      Object.send(:remove_const, name) rescue nil

      load(File.expand_path(filename))
      name.constantize.new(name, version)
    end

The `remove_const` plus `load` pair is what makes the method re-entrant: Ruby
drops the previously-defined constant and re-evaluates the file, so a second
`load_migration` for the same `filename` sees the file's current contents.

PR #7428 moved the class into `migration.ts` and ported the body as a dynamic
`import()` of `pathToFileURL(this.filename).href`, carrying
`@missingRailsCall load — PERMANENT` because `import()` is the only ESM analogue
of `load` and it is asynchronous. That receipt covers the asynchrony. It does
not cover the re-entrancy: ESM caches a module by URL forever, so `remove_const`
has no counterpart and a second `loadMigration` for the same path returns the
first evaluation's class. The proxy's own `_migration` memo hides this within
one proxy (`migration.rb:1191`'s `@migration ||=`), so the gap only shows across
two proxies naming the same file — which `Migration.copy` can produce, since it
rewrites the destination file and the destination `MigrationContext` may already
have a proxy for it.

Trails currently has no test that reloads a changed migration file in one
process, so nothing fails today; this is a latent divergence, not a live red.

## Converged shape

Give `loadMigration` the re-evaluation Ruby's `remove_const` + `load` buys. The
standard ESM technique is a cache-busting query on the import specifier — e.g.
appending a monotonically increasing token to the `file://` URL — so each call
evaluates the file afresh, matching Ruby. Decide deliberately whether that is
unconditional (Ruby's behaviour) or opt-in, and say why at the call site.

If it turns out to be genuinely unreachable — the language shortcoming is real
and no caller can observe it — convert the finding into a
`@missingRailsCall remove_const` receipt at the call site rather than closing
this story with prose. Per CLAUDE.md a deviation-convergence story converges or
is `tasks block`ed with the specific blocker.

## Acceptance criteria

- A regression test loads a migration file, mutates it on disk, and loads it
  again through a fresh `MigrationProxy`, asserting the second load reflects the
  change. The test must fail on the pre-fix implementation.
- `loadMigration` either re-evaluates the file the way Ruby does, or carries a
  receipt naming `remove_const` with the reason it cannot.
- `pnpm parity:api:calls`, `:calls:args` clean; no new baseline row.
- `pnpm vitest run packages/activerecord/src/migration-proxy.trails.test.ts`
  and the migrator suites pass.
