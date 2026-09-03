---
title: "SQLite3 dbconsole pushes config.database raw where rb:50 expands it against Rails.root"
status: draft
updated: 2026-09-03
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter.dbconsole`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:44-52`)
resolves the database path against the application root before handing it to
the client:

```ruby
def dbconsole(config, options = {})
  args = []

  args << "-#{options[:mode]}" if options[:mode]
  args << "-header" if options[:header]
  args << File.expand_path(config.database, Rails.respond_to?(:root) ? Rails.root : nil)

  find_cmd_and_exec(ActiveRecord.database_cli[:sqlite], *args)
end
```

trails
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:851-861`)
pushes `config.database` raw:

```ts
args.push(config.database!);
```

So a relative `database:` in `database.yml` — the normal case,
`db/development.sqlite3` — opens relative to the process cwd rather than the
application root, and the two differ whenever `dbconsole` is invoked from a
subdirectory.

Surfaced during review of #7450, which retyped `dbconsole`'s `config`
parameter as `DatabaseConfig` across all three adapters and converged the
mysql flag map; the reviewer confirmed this arm as pre-existing and out of
that PR's scope.

## Converged shape

`args.push(File.expandPath(config.database, ...))`, with the
`Rails.respond_to?(:root) ? Rails.root : nil` second argument ported as the
same conditional — `Trails.application` may be absent when the adapter is used
standalone, which is exactly what the Ruby `respond_to?` guard covers.
`File.expandPath` already exists in `@blazetrailsdev/ruby-compat`
(`packages/ruby-compat/src/file.ts`); check whether its `nil`-base arm matches
MRI's (cwd) before relying on it.

## Acceptance criteria

- [ ] `SQLite3Adapter.dbconsole` expands `config.database` against the
      application root, mirroring `sqlite3_adapter.rb:50`.
- [ ] The `Rails.respond_to?(:root)` conditional is ported, not dropped.
- [ ] `dbconsole-option-keys.trails.test.ts` covers a relative database path
      resolving against the root, and an absolute one passing through.
