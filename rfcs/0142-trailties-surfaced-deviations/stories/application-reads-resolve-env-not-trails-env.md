---
title: "Application credentials/secret_key_base read resolveEnv() instead of Trails.env; credentials_defaults key path not independent"
status: done
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 4
pr: trails#8131
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: null
closed-reason: null
---

## Context

Several trailties sites read the process env through `resolveEnv()` (`packages/trailties/src/database.ts`) where Rails reads `Rails.env`. A `Trails.env = "staging"` assignment (`rails.ts`, the port of `Rails.env=`) is therefore invisible to them:

- `defaultCredentialPaths` (`packages/trailties/src/application.ts:~247`) — Rails' `credentials_defaults` (`railties/lib/rails/application/configuration.rb:624-631`) uses `Rails.env`.
- the missing-secret_key_base message in `Application#keyGenerator` (`application.ts:~201`) — Rails `configuration.rb:524` interpolates `Rails.env`.
- `application.ts:243` / `:252` (`loadDatabaseConfig(opts.env ?? resolveEnv())` and the helper below it) — check each against its Rails counterpart.

`defaultCredentialPaths` also diverges in shape: it picks the env key path only when the env CONTENT file exists, and otherwise returns `config/master.key`. Rails decides the two independently (`configuration.rb:625-629`): `content_path` falls back if `config/credentials/<env>.yml.enc` is missing, and `key_path` falls back if `config/credentials/<env>.key` is missing. It is also named differently from Rails' private `credentials_defaults`.

## Converged shape

- Each site reads `Trails.env` where Rails reads `Rails.env`.
- `defaultCredentialPaths` becomes `credentialsDefaults`, with two independent existence checks as in `configuration.rb:625-629`, returning `{ contentPath, keyPath }`.

## Acceptance criteria

- With `Trails.env = "staging"` set in process and no `TRAILS_ENV`, credentials resolve `config/credentials/staging.yml.enc`, and the secret_key_base error names `'staging'`.
- An env content file with no env key file resolves `config/credentials/<env>.yml.enc` + `config/master.key`, as Rails does.
- The `pnpm parity:api` gates stay green.
