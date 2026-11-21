---
title: "ordered-options-fetch-through-delegate-missing"
status: ready
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps:
  - safe-buffer-declare-unsafe-string-methods
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

`ActiveSupport::OrderedOptions < Hash` (`vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_options.rb:32`) inherits `Hash#fetch`, so `EncryptedConfiguration`'s `delegate_missing_to :options` answers `credentials.fetch(:nothing, nil)` (`vendor/rails/v8.0.2/activesupport/test/encrypted_configuration_test.rb:33`). `packages/activesupport/lib/ordered-options.ts` has no `fetch`. Adding the member makes `pnpm parity:api:calls` report 8 NEW `fetch` rows in solid-queue `configuration.ts` and trailties `commands/server.ts`, `application/default-middleware-stack.ts`, `generators/app-base.ts`: the call gate stops crediting the native/helper form once a TS member named `fetch` exists (same root cause as `safe-buffer-declare-unsafe-string-methods`). The env-key test in `encrypted-configuration.test.ts` asserts `creds.get("nothing")` in its place.

## Acceptance criteria

- [ ] `OrderedOptions#fetch` answers `Hash#fetch`'s arms over its data, with no new call-gate rows.
- [ ] "reading configuration by env key" asserts `creds.fetch("nothing", null)` as Rails does.
