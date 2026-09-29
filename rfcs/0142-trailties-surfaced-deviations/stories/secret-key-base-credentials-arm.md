---
title: "secret-key-base-credentials-arm"
status: draft
updated: 2026-09-29
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

Rails' `Rails::Application::Configuration#secret_key_base`
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:504-514`)
falls back through `ENV["SECRET_KEY_BASE"] ||
Rails.application.credentials.secret_key_base || (Rails.env.local? && generate_local_secret)`.

trails' port (`packages/trailties/src/application/configuration.ts`, the
`secretKeyBase` getter) omits the middle arm: `Application#credentials()`
(`packages/trailties/src/application.ts`) is async — it reads and decrypts
`config/credentials*.yml.enc` through async fs — and the getter is a
synchronous reader, so it cannot await it. The getter carries
`@missingRailsCall credentials — CONVERGEABLE` pointing here.

The local-secret arm solved the same problem by warming `generateLocalSecret`
from `Application#initialize`; the credentials arm needs the equivalent: a
warmed credentials memo the sync getter can read.

## Acceptance criteria

- [ ] A booted production app with `secret_key_base` in its encrypted
      credentials and no `SECRET_KEY_BASE` env answers
      `config.secretKeyBase` with the credentials value, as
      `configuration.rb:510` does.
- [ ] The arm order matches `configuration.rb:506-512`: DUMMY → ENV →
      credentials → local secret.
- [ ] The `@missingRailsCall credentials` receipt on the getter is removed.
