---
title: "package-engine-models-reload"
status: draft
updated: 2026-11-25
rfc: "0142-trailties-surfaced-deviations"
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

Rails' main autoloader owns a gem engine's `app/models` and reloads them like
application code (`vendor/rails/v8.0.5.2/railties/lib/rails/engine.rb`, the
`set_autoload_paths` / `setup_main_autoloader` initializers). trails#10754
removed the invented `action_mailbox.app` initializer
(`packages/actionmailbox/lib/engine.ts`), so the main loader autoloads
`ActionMailbox::InboundEmail` and, through it, `ActiveStorage::Blob` from
`packages/activestorage/lib/app/models/active-storage/`.

With that change, `ReloadReseatsConstantTest > Dependencies.clear seats a new
app constant after a reload`
(`packages/trailties/test/application/reload-reseats-constant.trails.test.ts`)
fails after `reload()` with `uninitialized constant ActiveStorage::Blob`. The
raise comes from `Cref.get` (`packages/zeitwerk/lib/cref.ts:62`), called from
`Loader.autoloadSubdir` (`packages/zeitwerk/lib/loader.ts:549`) while the loader
descends into `blob/`. The likely cause: the reload unloads `Blob`, but the ESM
module for a package-shipped file is not evaluated again, so nothing seats the
constant. The `action_mailbox.app` import hid this by loading `Blob` before
`setup_main_autoloader`, so the loader never owned it. The same failure shows in
`FrameworksTest`, `RoutingTest`, `ViewReloadingTest` and
`boot-app-reload.trails.test.ts`.

## Acceptance criteria

- After a reload, a package-shipped engine's autoloaded `app/models` constant
  (`ActiveStorage::Blob`, `ActionMailbox::InboundEmail`) is seated again, as
  Zeitwerk reloads an engine's `app/models`.
- `reload-reseats-constant.trails.test.ts` passes with no engine initializer
  importing an engine model ahead of `setup_main_autoloader`.
