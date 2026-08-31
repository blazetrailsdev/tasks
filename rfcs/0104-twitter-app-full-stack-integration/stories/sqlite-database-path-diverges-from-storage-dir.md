---
title: "Generated sqlite3 database path is db/, not Rails' storage/"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new -d sqlite` writes its sqlite3 database paths under `db/`, where
Rails writes them under `storage/`.

Rails, `railties/lib/rails/generators/rails/app/templates/config/databases/sqlite3.yml.tt:14,21`:

```yaml
development:
  <<: *default
  database: storage/development.sqlite3

test:
  <<: *default
  database: storage/test.sqlite3
```

trails, `packages/trailties/src/generators/app-generator.ts` (`dbConfig`, the
`default:` arm) emits `db/development.sqlite3`, `db/test.sqlite3` and
`db/production.sqlite3`.

This is not cosmetic — the path is load-bearing for a second Rails behaviour.
`AppBase#skip_storage?` is `skip_active_storage? && !sqlite3?`
(`railties/lib/rails/generators/app_base.rb:364-366`), and `create_storage_files`
(`railties/lib/rails/generators/rails/app/app_generator.rb:468-470`) uses it to
keep `storage/` alive for a sqlite3 app _even when Active Storage is skipped_,
precisely because the database file lives there.

PR #7260 guarded the `storage/.gitkeep` emission on `skip_active_storage?`
rather than on `skip_storage?` for exactly that reason: with trails' database in
`db/`, Rails' `!sqlite3?` arm has nothing to keep, and porting it verbatim would
have emitted an empty `storage/` directory in every default app. That is a
deviation from `app_base.rb:364-366` standing in for this one.

The `.gitignore` template is already Rails-shaped here and assumes the Rails
layout — `gitignore.tt` comments its `/storage/*` block "uploaded files in
development **and any SQLite databases**" — while trails' generated
`.gitignore` carries a separate `db/*.sqlite3` block for the same files.

## Converged shape

`dbConfig`'s sqlite3 arm emits `storage/development.sqlite3`,
`storage/test.sqlite3` and `storage/production.sqlite3`, matching
`sqlite3.yml.tt:14,21`. `storage/.gitkeep` then reverts to Rails'
`skip_storage?` (`app_base.rb:364-366`) so the directory survives for a sqlite3
app with Active Storage skipped, and the generated `.gitignore` drops its
bespoke `/db/*.sqlite3` block in favour of the `/storage/*` block Rails already
emits.

Check the blast radius before flipping: `packages/trailties` commands and
`examples/twitter-clone` both reference the `db/` path, and any generated app
in the repo's fixtures will need regenerating.

## Acceptance criteria

- `trails new -d sqlite` writes `storage/<env>.sqlite3` in `src/config/database.ts`.
- `storage/.gitkeep` is guarded on the ported `skip_storage?`, not on
  `skip_active_storage?`.
- The generated `.gitignore` covers the database files through its `/storage/*`
  block, with no separate `db/*.sqlite3` rules.
- `app-generator.test.ts` covers the sqlite3 path and the sqlite3-keeps-storage
  case.
