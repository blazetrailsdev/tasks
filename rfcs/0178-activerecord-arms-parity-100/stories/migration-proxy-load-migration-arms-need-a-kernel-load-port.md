---
title: "migration-proxy-load-migration-arms-need-a-kernel-load-port"
status: claimed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-09T20:55:38Z"
assignee: "migration-proxy-load-migration-arms-need-a-kernel-load-port"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-1-residue`, which converged every
other `migration.ts` row. One row of `pnpm parity:api:arms:report --package=activerecord --direction=invented`
is left:

- `activerecord/migration.ts#loadMigration` — `-try -rescue +if +throw`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:1196-1201`):

```ruby
def load_migration
  Object.send(:remove_const, name) rescue nil

  load(File.expand_path(filename))
  name.constantize.new(name, version)
end
```

The port (`packages/activerecord/src/migration.ts`, `MigrationProxy#loadMigration`) has none of the three
calls. It `import()`s `pathToFileURL(this.filename)` from `node:url` with a `?${loadMigrationSeq += 1}` query
(the cache-buster trails#7447 added in place of `remove_const`), reads `mod[this.name]` off the module
namespace, and open-codes `typeof klass !== "function"` + `new NameError("uninitialized constant …")`, which is
the invented `if` / `throw`. The missing `try` / `rescue` is the `remove_const … rescue nil`.

Why it did not fit the residue PR: converging needs a `Kernel#load` port, which ruby-compat does not have
(`grep -rn "rbFLoad\|removeConst" packages/ruby-compat/src` is empty). An ESM migration file exports its
class; nothing seats it in the Object constant table, so `constantize(this.name)` cannot find it. The port
has to decide what `load` means for an ES module: an awaited `import()` whose exports are seated as constants
(`rbModConstSet(TopLevel, name, value)`), with `remove_const` un-seating the name and busting the module
cache. CLAUDE.md § "An adapter file is loaded by an awaited step" ratifies an awaited `import()` for one
`require` and says no other `require` is ported that way, so the `load` shape needs the repo owner's ruling
before it is built. The `node:url` import also breaks the no-`node:*` rule and goes away with it.

## Acceptance criteria

- [ ] `MigrationProxy#loadMigration` is `remove_const` (rescued), `load(File.expand_path(filename))`,
      `constantize(name)` + `new`, in Rails' order, with no `node:*` import and no open-coded `NameError`.
- [ ] The `load` / `remove_const` ports live in ruby-compat with MRI citations, or the row carries a
      `PERMANENT` receipt after the owner rules the shape cannot converge.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no `loadMigration` row,
      and `migration-proxy.trails.test.ts` (a changed file re-evaluates) still passes.
