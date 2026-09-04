---
title: "converge-db-system-change-database-config-to-a-template"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ChangeGenerator#editDatabaseConfig`
(`packages/trailties/src/generators/rails/db/system/change/change-generator.ts:54-61`)
builds the new database config by string-templating it in TypeScript
(`databaseConfigTs(...)`, then `writeOrUpdate`). Rails copies a template file:

```ruby
# railties/lib/rails/generators/rails/db/system/change/change_generator.rb:37-39
def edit_database_config
  template(database.template, "config/database.yml")
end
```

`Database#template` (`railties/lib/rails/generators/database.rb`) names the
per-adapter `.yml.tt` under `rails/generators/rails/app/templates/config/`, and
`AppGenerator` templates the same file — one source for both generators.
trails' `AppGenerator` and `ChangeGenerator` each carry their own copy of that
knowledge instead.

The gap was invisible until PR #7385 added a `template` method to the
authentication generator: with no TS method named `template` anywhere in
`trailties`, the call gate treated Rails' `template` call as unported and never
compared it. It now flags, and the PR added a baseline row citing this story:
`scripts/api-compare/call-mismatches-exclude/trailties/generators/rails/db/system/change/change-generator.json`.

## Acceptance criteria

- The per-adapter database config lives in one place both generators template
  from, mirroring `database.rb`'s `template` reader.
- `editDatabaseConfig` calls that `template`, as `change_generator.rb:37-39`
  does, rather than composing the file inline.
- The `edit_database_config` / `template` row is deleted from
  `call-mismatches-exclude/trailties/generators/rails/db/system/change/change-generator.json`
  and the file's high-water mark tightened (`pnpm parity:api:calls:tighten`).
- `ChangeGenerator`'s existing tests still pass.
