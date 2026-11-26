---
title: "compiled-root-config-readers-resolve-js"
status: ready
updated: 2026-11-26
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Booting a tsc-compiled root (`config.js`, no `config.ts`) from `trails build`'s entry (trails#10780) fails on two config readers that name the `.ts` file only:

- `packages/activestorage/lib/engine.ts:250` builds `config/storage.ts` and raises "Couldn't find Active Storage configuration" when only `config/storage.js` exists. Rails: `vendor/rails/v8.0.5.2/activestorage/lib/active_storage/engine.rb` (`config_choice = Rails.root.join("config/storage.yml")`).
- `packages/trailties/lib/application/configuration.ts` (~line 530, `databaseConfiguration`) raises "Could not load database configuration. No such file - [\"config/database.ts\"]" because it reads `paths["config/database"]` as given. Rails: `vendor/rails/v8.0.5.2/railties/lib/rails/application/configuration.rb` `database_configuration`.

Found by compiling `examples/twelve-dollar-server` with `tsc --outDir dist --rewriteRelativeImportExtensions` and booting `dist/config/environment.js`.

## Acceptance criteria

- Both readers resolve the `.js` sibling in a compiled root (the existing `resolveTsThenJs` / `isCompiledFile` arms), with no new helper.
- A test boots a compiled fixture with `config/storage.js` and `config/database.js` and no `.ts` files.
