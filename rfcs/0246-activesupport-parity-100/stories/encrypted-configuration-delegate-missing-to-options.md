---
title: "encrypted-configuration-delegate-missing-to-options"
status: in-progress
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10458
claim: "2026-11-20T22:47:06Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::EncryptedConfiguration` does `delegate_missing_to :options`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/encrypted_configuration.rb:52`),
so `credentials.fetch(:nothing, nil)`, `credentials.foo = 42` and `credentials.something!`
reach `OrderedOptions`. In trails (`packages/activesupport/lib/encrypted-configuration.ts`,
`delegateMissingTo.call(EncryptedConfiguration, "options", { allowNil: true })`):

- `fetch` is not forwarded (`TypeError: creds.fetch is not a function`);
- a dynamic writer (`creds.foo = 42`) does not reach `options`, so `creds.get("foo")` is not 42;
- `somethingBang()` does not raise `KeyError`.

Four tests in `packages/activesupport/test/encrypted-configuration.test.ts` stay `it.skip`:
"reading configuration by env key" (`encrypted_configuration_test.rb:24-37`),
"writing with dynamic accessor and reading with element reference" (`:64-67`),
"change configuration by key file" (`:69-78`, also needs `config` reset after `change`),
"raises key error when accessing config via bang method" (`:132-134`).

## Acceptance criteria

- [ ] `delegate_missing_to :options` forwards reads, writers and bang readers as Rails does.
- [ ] The four tests run and pass; `encrypted_configuration_test.rb` shows 0 Skip.
