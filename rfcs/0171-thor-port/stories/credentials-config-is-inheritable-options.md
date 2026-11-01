---
title: "credentials-config-is-inheritable-options"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`CredentialsCommand#edit` calls `config.overridden?(:content_path)` (`vendor/rails/v8.0.2/railties/lib/rails/commands/credentials/credentials_command.rb:22-23`), and Rails' `config.credentials` is `InheritableOptions.new(credentials_defaults)` (`railties/lib/rails/application/configuration.rb:77`). trails' `config.credentials` is a plain object with null defaults (`packages/trailties/src/application/configuration.ts`), and `InheritableOptions` has no `isOverridden` (`activesupport/lib/active_support/ordered_options.rb:130`).

## Acceptance criteria

- [ ] `InheritableOptions#isOverridden` is ported.
- [ ] `config.credentials` is an `InheritableOptions` over `credentialsDefaults`.
- [ ] The `@missingRailsCall overridden?` receipt on `CredentialsCommand#edit` is removed.
