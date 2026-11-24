---
title: "framework-class-load-hooks-fire-after-app-initializers"
status: draft
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

Rails defers a framework class's `ActiveSupport.run_load_hooks` until the class is first
referenced (Zeitwerk autoload / `require` at first use), which in an app boot is after
`load_config_initializers`. trails evaluates those class files by ES import before boot, so the
hooks fire at once inside the registering initializer, before the app's `config/initializers/*`:

- `packages/actionpack/lib/action-controller/base.ts:737` `runLoadHooks("action_controller", Base)`
  (and `api.ts:172`) — `packages/trailties/lib/trailties/action-controller.ts`
  `action_controller.parameters_config` / `set_configs` read config before initializers
  (`vendor/rails/v8.0.5.2/actionpack/lib/action_controller/railtie.rb:38-56`).
- `packages/activerecord/lib/encryption.ts:28` `runLoadHooks("active_record_encryption", …)`
  (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/railtie.rb` "active_record_encryption.configuration").
- `packages/activestorage/lib/engine.ts` `active_storage.app` initializer (no Rails counterpart; the
  stand-in for autoloading `app/models/active_storage/blob.rb`) `await import("./blob.js")`, whose
  `runLoadHooks("active_storage_blob")` (`blob.ts:582`) makes `active_storage.services` raise
  "Couldn't find Active Storage configuration" for an app with no `config/storage.ts`, where Rails
  raises only when `ActiveStorage::Blob` is first used.

There is no JS hook on first reference and no synchronous `import()`, so the fix needs a ratified
mechanism (e.g. framework class modules run their load hooks from a boot step placed after
`load_config_initializers`, or an autoload seat on the namespace for engine "app" classes).

## Acceptance criteria

- [ ] Operator ruling recorded in CLAUDE.md on when a framework class's `runLoadHooks` fires relative
      to app initializers.
- [ ] Unblocks `trailties-action-controller-load-hooks-run-after-app-initializers`,
      `framework-onload-hooks-see-config-initializers`, `activestorage-index-import-loads-blob-eagerly`.
