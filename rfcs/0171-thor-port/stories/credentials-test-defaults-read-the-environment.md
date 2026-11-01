---
title: "credentials-test-defaults-read-the-environment"
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

The `credentialsDefaults` mock in `packages/trailties/src/commands/credentials.test.ts:44-53` picks production paths by file existence. Rails builds them from `Rails.env` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:624-632`), so the `--environment` show assertions (`railties/test/commands/credentials_test.rb:101-118`) would pass if `show` ignored the option.

## Acceptance criteria

- [ ] The test reads the environment `requireApplicationBang` sets, or uses the real `credentialsDefaults`, so that ignoring `--environment` fails it.
