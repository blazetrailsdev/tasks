---
title: "EncryptedConfiguration#deserialize through YAML.unsafe_load, rescuing Psych::SyntaxError"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["activesupport"]
deps:
  [
    "psych-syntax-error-and-exception-hierarchy",
    "psych-scalar-scanner-tokenize",
    "psych-libyaml-seam-without-top-level-await",
  ]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/encrypted_configuration.rb:115-124`:
`YAML.unsafe_load(content, filename: content_path)` (`respond_to?(:unsafe_load)`
arm), and `rescue Psych::SyntaxError` → `raise InvalidContentError.new(content_path)`.
`InvalidContentError#message` appends `cause.message` when
`cause.is_a?(Psych::SyntaxError)` (`:36-44`). trails
(`packages/activesupport/src/encrypted-configuration.ts:9-14,115-127`) dynamically
imports the old subpath, calls npm `parse(content, { mapAsMap: true, version: "1.1" })`,
and matches `e.name === "YAMLParseError"`.

Credentials are the one production-hot YAML read (`secret_key_base`,
`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:504-514`). RFC Q2
records that no JSON alternative is added.

## Acceptance criteria

- [ ] `deserialize` is synchronous, calls `YAML.unsafeLoad(content, { filename: contentPath })`,
      and rescues `Psych.SyntaxError` into `InvalidContentError`. The
      `mapAsMap` / `version` npm options are gone. Check how `config`'s
      readers handle a plain-object hash where they relied on `Map`.
- [ ] `InvalidContentError#message` checks `instanceof Psych.SyntaxError`.
- [ ] `encrypted-configuration` tests and the trailties credentials tests
      stay green.

## Verification

`pnpm vitest run packages/activesupport/src/encrypted-configuration*.test.ts packages/trailties/src/commands/credentials*.test.ts`.
