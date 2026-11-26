---
title: "encrypted-configuration-invalid-content-error-message-override"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T03:44:51Z"
assignee: "encrypted-configuration-invalid-content-error-message-override"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::EncryptedConfiguration::InvalidContentError#message`
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/encrypted_configuration.rb:41-43`)
overrides `message`: `cause.is_a?(Psych::SyntaxError) ? "#{super}\n\n  #{cause.message}" : super`.

trails (`packages/activesupport/lib/encrypted-configuration.ts`, `InvalidContentError`)
computes the combined text in the constructor instead, because `Error`'s constructor seats
an own `message` data property, which shadows any `get message()` a subclass declares.
ruby-compat's `Exception` (`packages/ruby-compat/lib/exception.ts`) defines `message` as a
prototype accessor over `toS`, but the own property still wins.

Surfaced by activesupport-api-remainder-reaches-100, which left `message` as a
`SCOPED_SKIP_GROUPS` row in `scripts/parity/conventions.ts` pointing here.

## Acceptance criteria

- [ ] `InvalidContentError` extends ruby-compat's `RuntimeError` (Rails: `< RuntimeError`),
      its constructor passes only `"Invalid YAML in '#{content_path}'."`, and a
      `message` override reads `super.message` and appends the Psych cause, as Rails does.
      This needs ruby-compat's `Exception` to keep `mesg` where an own `message` does not
      shadow a subclass accessor.
- [ ] The `SCOPED_SKIP_GROUPS` row for `encrypted_configuration.rb` `message` is deleted.
