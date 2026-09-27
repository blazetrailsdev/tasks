---
title: "encrypted-configuration-options-delegation-and-validate"
status: draft
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
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

trails#8183 ported `ActiveSupport::EncryptedConfiguration`
(`packages/activesupport/src/encrypted-configuration.ts`) from
`vendor/rails/v8.0.2/activesupport/lib/active_support/encrypted_configuration.rb`,
but only `read`, `config`, `deserialize`, `InvalidContentError` and
`InvalidKeyError`. These are still unported:

- `config`'s `deep_symbolize_keys` (`:59-61`, `:67-73`). This is the only raise
  site for `InvalidKeyError` besides `validate!`, so trails'
  `InvalidKeyError` is currently never raised. The rails-error-parity lint
  requires the class to exist.
- `validate!` (`:51-57`) and `inspect` (`:63-65`).
- `delegate_missing_to :options` (`:31`), `options` (`:85-87`) and
  `deep_transform` (`:75-83`). This is what gives Rails `credentials.dig(:a, :b)`
  and `credentials.a.b`. Wrapping the instance in `delegateMissingTo(this, "options")`
  was tried in #8183 and fails: `read` is async, so `options` cannot load on
  first touch, and `await app.credentials()` probes `then` on the unloaded
  instance, which raises `DelegationError`. So
  `packages/trailties/src/trailties/active-record.ts`'s
  `active_record_encryption.configuration` initializer indexes the awaited
  `config()` hash instead of calling `app.credentials.dig(...)`
  (`activerecord/lib/active_record/railtie.rb:339-341`).

## Acceptance criteria

- `deep_symbolize_keys` / `validate!` / `inspect` / `options` / `deep_transform`
  are ported in Rails member order. Where one cannot be ported, it is blocked
  with the specific language reason.
- `InvalidKeyError` has a raise site, or the story records why none is reachable
  from a JS object key.
- The credentials read in the AR railtie initializer converges on `dig` once a
  synchronous `options` exists. One possibility is resolving `config` before
  `Application#credentials` returns.
