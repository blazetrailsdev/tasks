---
title: "trailties-credentials-read-lazily-not-at-boot"
status: claimed
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-21T04:50:34Z"
assignee: "trailties-credentials-read-lazily-not-at-boot"
blocked-by: null
closed-reason: null
---

## Context

`Application#initializeBang` (`packages/trailties/lib/application.ts`, the
`@inventedArm credentials — PERMANENT` arm) awaits `this.credentials()` before
`runInitializers`, decrypting `config/credentials.yml.enc` eagerly at boot.
Rails' `Application#credentials` is lazy
(`vendor/rails/v8.0.2/railties/lib/rails/application.rb`, `def credentials`),
so nothing is read until a caller asks. The eager read breaks these ported
Rails tests (left unported by trails#PR for this reason):

- `railties/test/commands/credentials_test.rb:80` "edit command can add master key when require_master_key is true" — boot raises `MissingKeyError` before `ensure_encryption_key_has_been_added`.
- `railties/test/commands/encrypted_test.rb:65` "edit command can add master key when require_master_key is true" — same.
- `railties/test/commands/credentials_test.rb:166` "edit command preserves user's content even if it contains invalid YAML" — second boot raises `InvalidContentError`.
- `railties/test/application/credentials_test.rb:20` "reads credentials from customized path and key" — the prewarm runs before `load_environment_config`, so `config.credentials.content_path` set in `config/environments/production.ts` is never seen.
- `railties/test/commands/credentials_test.rb:331` "respects config.credentials.content_path when set in config/environments/\*.rb" — `credentials:show` under `TRAILS_ENV=production` raises `InvalidMessage`.
- `railties/test/commands/credentials_test.rb:342` "respects config.credentials.key_path when set in config/environments/\*.rb" — same.

The only sync reader of the prewarmed value is `Configuration#secretKeyBase`
(`packages/trailties/lib/application/configuration.ts`, `_credentials?.dig`).

Also: `railties/test/commands/credentials_test.rb:147` "edit command can use custom template to
generate credentials file" fails with `LoadError ... credentials.yml.tt.js`:
an app's `lib/templates/trails/credentials/credentials.yml.tt` is not
compiled (root CLAUDE.md § "Templates are precompiled").

## Acceptance criteria

- [ ] Credentials are read lazily as Rails reads them; the `@inventedArm credentials` arm is removed or converged.
- [ ] The listed tests are ported into `packages/trailties/test/commands/credentials.test.ts`, `encrypted.test.ts`, `application/credentials.test.ts` and pass.
- [ ] The custom-template test is ported, or parked `PERMANENT-SKIP:` if templates must be precompiled.
