---
title: "trails new scaffolds ActionCable, ActionMailer, ActiveJob, ActiveStorage and Puma, none of which exist"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` scaffolds directories and config for four Rails subsystems that
have no package in this repo, plus a server that trails does not run. The
files are inert stubs — nothing imports them, and they compile — but they tell
a new user the framework has features it does not, and they are dead weight in
every generated app.

`ls packages/` has no `actioncable`, `actionmailer`, `activejob`, or
`activestorage`. Emitted anyway by
`packages/trailties/src/generators/app-generator.ts`:

**ActionCable** — no package.

- `src/app/channels/application-cable/channel.ts` → `export class Channel {}`
- `src/app/channels/application-cable/connection.ts` → `export class Connection {}`
- `src/config/cable.ts` → an adapter config for a cable server that does not exist

**ActionMailer** — no package.

- `src/app/mailers/application-mailer.ts` → a class with `defaultFrom` and
  `layout` fields, extending nothing
- `src/app/views/layouts/mailer.html.tse`, `mailer.text.tse`
- the `authentication` generator additionally emits
  `src/app/mailers/passwords-mailer.ts`,
  `test/mailers/previews/passwords-mailer-preview.ts`, and
  `src/app/views/passwords-mailer/reset.{html,text}.tse`

**ActiveJob** — no package.

- `src/app/jobs/application-job.ts` → `export class ApplicationJob { queueAs = "default"; }`,
  extending nothing

**ActiveStorage** — no package.

- `src/config/storage.ts` → Disk service config
- `storage/.gitkeep`

**Puma** — trails serves through Vite (`server/dev-server.ts`) or a
hand-rolled `node:http` bridge; there is no Puma and no Rack handler
(see `no-rack-node-http-handler`).

- `src/config/puma.ts` → workers/pidfile config nothing reads

Rails emits each of these because the corresponding gem is a real dependency
of the default stack
(`railties/lib/rails/generators/rails/app/app_generator.rb`, the
`create_channel_files` / `create_mailer_files` / `create_job_files` /
`create_storage_files` steps, each guarded by its own `--skip-*` flag:
`railties/lib/rails/generators/app_base.rb`). Rails already has the mechanism
— the guards — trails simply has nothing behind them.

Two adjacent files are _not_ in scope here, because they have backing code and
are only unwired rather than unsupported: `src/app/helpers/application-helper.ts`
(ActionView helpers exist but are not in a `.tse` template's scope — see
`helper-methods-not-in-tse-scope`) and `src/config/initializers/*` (the
initializer chain exists but is never run — see
`splice-finisher-initializers`).

## Converged shape

Each subsystem's scaffolding is emitted only when its package exists, matching
Rails' `--skip-action-cable` / `--skip-action-mailer` / `--skip-active-job` /
`--skip-active-storage` guards in `app_base.rb` — but defaulting to skipped
until the package lands, so the default `trails new` describes only what
trails can actually do. When a package is ported, flipping its default is a
one-line change and the templates are already written.

## Acceptance criteria

- A default `trails new` emits no `app/channels`, `app/mailers`, `app/jobs`,
  `config/cable.ts`, `config/storage.ts`, `config/puma.ts`, `storage/`, or
  mailer layouts.
- The emission is guarded per subsystem in the Rails shape, not deleted
  outright, so each guard flips when its package lands.
- `trails generate authentication` emits no mailer files while ActionMailer
  is unported, or is documented as requiring it.
- The app-generator snapshot test covers the reduced default tree.
- `examples/twitter-app` drops the stub files it inherited.
