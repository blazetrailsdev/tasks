---
title: "EncryptedConfiguration InvalidKeyError reports 42.0 key as 42 (YAML float/int collapse)"
status: ready
updated: 2026-10-22
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

Since trails#8946, `deserialize`
(`packages/activesupport/src/encrypted-configuration.ts:124-125`) reads
credentials through `Psych.unsafeLoad`, as Rails does, so the YAML is resolved
by ruby-compat's Psych scalar scanner. `InvalidKeyError`
(`encrypted-configuration.ts:32`) still formats the key with `String(key)`, and
both "unsupported keys" tests in `encrypted-configuration.test.ts` (`:73`, `:82`)
assert only the `42` arm; Rails' `42.0` arm is not ported.

## Converged shape

`InvalidKeyError` formats the key as Ruby's `"#{key}"` does, through
ruby-compat's `rbObjAsString` (which renders a Float through `floToS`), and the
`42.0` key arrives as the Float Psych's scalar scanner answers for it. If the
scanner answers a bare JS `42` for `42.0`, fix the scanner's Float arm
(`psych/scalar_scanner.rb` `tokenize`) rather than special-casing the key.

## Acceptance criteria

- Both `encrypted-configuration.test.ts` "unsupported keys" tests carry Rails'
  `42.0: value` arm, asserting `Key '42.0' is invalid, ...`.
- `InvalidKeyError` has no `String(key)` call.
