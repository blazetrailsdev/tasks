---
title: "Load and register an application's app/channels classes"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["trailties"]
deps: ["port-actioncable-engine", "actioncable-class-names-round-trip-through-constantize"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails finds `ChatChannel` and `ApplicationCable::Connection` through
Zeitwerk: `app/channels` is an autoload root, so
`"ChatChannel".safe_constantize` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/subscriptions.rb:39`) and
`"ApplicationCable::Connection".safe_constantize` (`engine.rb:55`) load the
file on first use.

trails has no autoloader (CLAUDE.md § "Trails has no autoloader"). The port of
an autoload root is an eager directory scan: `loadControllers` in
`packages/trailties/src/application/finisher.ts:210` does it for
`app/controllers`, and `0169/eager-load-app-jobs-in-finisher` (draft) does it
for `app/jobs`.

This story scans `app/channels`, imports each file, and registers each
exported `Channel::Base` or `Connection::Base` subclass under its Ruby
constant name, derived from the path
(`app/channels/chat/appearances_channel` → `Chat::AppearancesChannel`,
`app/channels/application_cable/connection` →
`ApplicationCable::Connection`), using the mechanism
`actioncable-class-names-round-trip-through-constantize` settled. If the
jobs story has landed, share its scan helper.

## Fidelity traps (predicted at authoring)

- [ ] **Without this, no client can subscribe**: every subscribe command logs "Subscription class not found".
- [ ] **`ApplicationCable::Connection` is optional.** With no such file the engine's wrapper falls back to `ActionCable::Connection::Base`.
- [ ] **Both `snake_case` and `kebab-case` file names** are accepted by `loadControllers`; do the same.
- [ ] **Reloading.** `before_class_unload` restarts the cable server; the scan must re-register the reloaded classes, not keep the old ones.
- [ ] **A channel file that exports no channel class** is ignored, not an error.
- [ ] **Skip the scan when the engine is not loaded** (an app generated with `--skip-action-cable`).

## Acceptance criteria

- [ ] A booted fixture app with `app/channels/chat_channel` and a namespaced `app/channels/chat/appearances_channel` accepts a subscribe command for each by its Ruby name.
- [ ] `app/channels/application_cable/connection` is used as the connection class when present.
- [ ] The scan shares a helper with `loadControllers` (and the jobs scan if landed).

## Definition of done

Asking applications to register their channels by hand does not close this story.

## Verification

```bash
pnpm vitest run packages/trailties/src/application
```
