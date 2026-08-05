---
title: "Delete encryption's ConfigError/EncryptionError/DecryptionError aliases for Rails' Errors classes"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6102
claim: "2026-08-04T21:23:01Z"
assignee: "i18n-date-parse-extract-valid-date-frags-p"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/encryption/errors.ts` carries three classes Rails does
not define, each a `@deprecated` alias of a Rails one:

- `EncryptionError extends Base` — Rails has `Errors::Encryption`
- `DecryptionError extends Decryption` — Rails has `Errors::Decryption`
- `ConfigError extends Configuration` — Rails has `Errors::Configuration`

Rails' full list is `vendor/rails/activerecord/lib/active_record/encryption/errors.rb:6-13`:
`Base`, `Encoding`, `Decryption`, `Encryption`, `Configuration`, `ForbiddenClass`,
`EncryptedContentIntegrity` — seven classes, no aliases.

PR #6082 retired the largest `ConfigError` caller (`Config#get`, itself a trails
invention, now deleted) and converged `scheme.test.ts` onto `Configuration`, but
the aliases and their remaining callers survive:
`cipher/aes256-gcm.ts:80,121,138`, `encryptor.ts:65,79,216`,
`deterministic-key-provider.ts:14`, `scheme.ts:174-186`, plus the matching
`*.test.ts` expectations.

Each alias also overrides `name` to the trails spelling (`this.name = "ConfigError"`),
so an error's `name` — which is what `Errors::Configuration#class.name` answers in
Ruby and what trails assertions narrow on — reads as a class Rails has never heard of.

## Converged shape

Delete the three aliases; every raise site constructs the Rails class
(`Configuration`, `Decryption`, `Encryption`) and every test expectation narrows
on it. `Base#constructor` already sets `name` from `this.constructor.name`, so the
Rails spelling falls out once the aliases are gone.

## Acceptance criteria

- [ ] `errors.ts` defines exactly Rails' seven classes (errors.rb:6-13), no aliases.
- [ ] No `ConfigError` / `EncryptionError` / `DecryptionError` reference remains in
      `packages/activerecord/src`.
- [ ] Encryption suites green on all three lanes.
