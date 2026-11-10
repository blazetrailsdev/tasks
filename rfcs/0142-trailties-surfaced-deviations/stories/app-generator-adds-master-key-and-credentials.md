---
title: "app-generator-adds-master-key-and-credentials"
status: in-progress
updated: 2026-11-10
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9974
claim: "2026-11-10T22:42:14Z"
assignee: "app-generator-adds-master-key-and-credentials"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AppGenerator` runs `master_key` and `credentials`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:179-193`),
which write `config/master.key` and `config/credentials.yml.enc`. trails'
`packages/trailties/src/generators/trails/app/app-generator.ts` has neither step, so the
isolation harness's app template (`src/test-helpers/isolation/global-setup.ts`) has no
credentials. Booting it in production raises
"Missing `secret_key_base` for 'production' environment"
(`src/application/configuration.ts:487`), so every isolated test that calls `app()` (default
env `"production"`) or sets `Trails.env = "production"` fails.

Blocked tests (marked `// BLOCKED: app-generator-adds-master-key-and-credentials`):

- `src/application/initializers/hooks.test.ts` "after_initialize happens after to_prepare in production"
- `src/application/initializers/notifications.test.ts` "trails load_config_initializer event is instrumented"

## Acceptance criteria

- `AppGenerator` gains `masterKey` / `credentials` steps that mirror `app_generator.rb:179-193`
  (MasterKeyGenerator#add_master_key_file_silently / ignore_master_key_file_silently,
  CredentialsGenerator#add_credentials_file).
- The two tests above are un-skipped and pass.
