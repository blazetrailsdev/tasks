---
title: "secret-key-base-reads-credentials-memo"
status: draft
updated: 2026-11-09
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

`Rails::Application::Configuration#secret_key_base` calls `Rails.application.credentials.secret_key_base`
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:509`), and `Application#credentials`
memoizes `@credentials ||= encrypted(...)` (`vendor/rails/v8.0.2/railties/lib/rails/application.rb:496`).

trails' `Application#credentials()` (`packages/trailties/lib/application.ts`) is async because the
encrypted file is read through async fs, so the sync `secretKeyBase` getter
(`packages/trailties/lib/application/configuration.ts`) reads the `_credentials` memo that
`initializeBang` warms instead (trails#9928). The getter carries `@missingRailsCall credentials` pointing here.

## Acceptance criteria

- [ ] The `secretKeyBase` getter reaches credentials through `Trails.application.credentials` as
      `configuration.rb:509` does, or the limit is ratified in CLAUDE.md and the receipt turned PERMANENT.
- [ ] `initializeBang`'s `@inventedArm credentials` warm is removed or ratified alongside.
