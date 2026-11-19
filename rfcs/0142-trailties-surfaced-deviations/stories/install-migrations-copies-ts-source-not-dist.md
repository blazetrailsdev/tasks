---
title: "active_storage:install copies the compiled dist .js migration, not the .ts source"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#174 ran `bin/trails active_storage:install` in an app that consumes the packed `@blazetrails/activestorage`. It copied `db/migrate/<v>_create_active_storage_tables.active_storage.js`, the compiled output from `dist/`: 4-space indented, with a dangling `//# sourceMappingURL=…js.map` line. It did not copy the TypeScript source. The package's `files` lists only `dist` (`packages/activestorage/package.json:31`), and `Migration.copy` keeps the source file's extension (`packages/activerecord/lib/migration.ts:1111`, `File.extname(migration.filename)` in the destination name). The engine's migrations path therefore resolves into `dist/`.

Rails copies the gem's own `.rb` source (`activestorage/db/migrate/20170806125915_create_active_storage_tables.rb`, through `ActiveRecord::Migration.copy`, `activerecord/lib/active_record/migration.rb`), so the app gets the authored file.

## Acceptance criteria

- [ ] `active_storage:install`, and every engine's `railties:install:migrations`, run against a packed package copies the `.ts` migration source, as authored, into the app's `db/migrate`.
- [ ] The copy carries no `sourceMappingURL` line.
- [ ] A test installs from a packed tarball (or from a dist-only layout) and asserts the copied file is `.ts`.
