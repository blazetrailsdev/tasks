---
title: "credentials-config-is-inheritable-options"
status: done
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9667
claim: "2026-11-03T14:27:04Z"
assignee: "intermediate-namespaces-seated-drop-const-get-full-path-row"
blocked-by: null
closed-reason: null
---

## Context

`CredentialsCommand#edit` calls `config.overridden?(:content_path)` (`vendor/rails/v8.0.2/railties/lib/rails/commands/credentials/credentials_command.rb:22-23`), and Rails' `config.credentials` is `InheritableOptions.new(credentials_defaults)` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:77`). `InheritableOptions#isOverridden` is already ported (`packages/activesupport/src/ordered-options.ts:224`, trails#6608). What is left: trails' `config.credentials` is still a plain `{ contentPath, keyPath }` object with null defaults (`packages/trailties/src/application/configuration.ts:91`), so `packages/trailties/src/commands/credentials.ts:142,153` call `credentialsDefaults()` instead and carry `@inventedArm credentialsDefaults — CONVERGEABLE credentials-config-is-inheritable-options`.

## Acceptance criteria

- [ ] `config.credentials` is an `InheritableOptions` over `credentialsDefaults`.
- [ ] `CredentialsCommand` reads `config.credentials.isOverridden("contentPath")` / `contentPath` as Rails does, and both `@inventedArm credentialsDefaults` receipts in `commands/credentials.ts` are removed.
