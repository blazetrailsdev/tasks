---
title: "EncryptedConfiguration InvalidKeyError reports 42.0 key as 42 (YAML float/int collapse)"
status: draft
updated: 2026-09-28
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::EncryptedConfiguration#deep_symbolize_keys`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/encrypted_configuration.rb:67-73`)
raises `InvalidKeyError.new(content_path, key)` with the key interpolated by
`to_s`, so a `42.0:` YAML key reports `Key '42.0' is invalid`
(`activesupport/test/encrypted_configuration_test.rb:86-89,103-106`).

trails#8197 parses credentials with `parse(content, { mapAsMap: true, version: "1.1" })`
(`packages/activesupport/src/encrypted-configuration.ts`, `deserialize`), and
`InvalidKeyError` formats the key with `String(key)`. YAML `42` and `42.0` both
parse to the JS number `42`, so the `42.0` assertions of both "unsupported keys"
tests are not ported.

## Converged shape

Parse with `intAsBigInt: true` so a YAML integer is a `bigint` and a YAML float
stays a `number`. `InvalidKeyError` then formats the key as Ruby's `to_s` does:
`Integer#to_s` for a bigint, and `Float#to_s` for a number (`42.0`). Use
ruby-compat's Float#to_s port if one exists; otherwise port `flo_to_s`.

## Acceptance criteria

- Both `encrypted-configuration.test.ts` "unsupported keys" tests carry Rails'
  `42.0: value` arm, asserting `Key '42.0' is invalid, ...`.
- Integer-valued credentials still read back as JS numbers through `config()` / `dig`,
  or the change is justified against Rails' Integer values.
