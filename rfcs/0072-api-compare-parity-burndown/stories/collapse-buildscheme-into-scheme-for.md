---
title: "Retire encryption.ts#buildScheme — Rails has one scheme_for, trails has two"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6136
claim: "2026-08-05T16:53:06Z"
assignee: "date-to-s-does-not-zero-pad-the-year"
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one scheme constructor for encrypted attributes,
`EncryptableRecord#scheme_for`
(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:69-76`),
called from inside `encrypt_attribute`'s `decorate_attributes` block (`:85-88`).

trails has two. `encryption.ts#buildScheme` is a second, parallel `scheme_for` for
the `Base.encrypts` path: it exists to adapt the legacy `{ encrypt, decrypt }`
encryptor shim (`LegacyEncryptorShim`) and to supply a `defaultEncryptor` fallback
when no key material is configured, neither of which Rails has. `encryptAttribute`
therefore takes a `buildScheme?: () => Scheme` parameter selecting which one runs.

The cost is that every `scheme_for` change has to be made twice. PR #6126 hit this
directly: converging the eager `previous_schemes` assignment
(`encryptable_record.rb:70-76`) required the same two lines in both bodies, and a
reviewer can only verify they agree by reading both.

## Converged shape

One `scheme_for`. Fold the shim into it so `buildScheme` disappears along with
`encryptAttribute`'s function parameter:

- `LegacyEncryptorShim` construction belongs behind the `encryptor:` option
  `Scheme` already accepts — a caller passing `{ encrypt, decrypt }` should be
  normalized where the option is read, not in a second scheme builder.
- The `defaultEncryptor` fallback is trails-only surface with no Rails counterpart
  (Rails raises "No encryption key provided" from `Encryptor` and that is the
  intended behaviour); check whether it can simply be deleted, and if it cannot,
  file what still depends on it rather than keeping the second builder alive.

Once there is one builder, `encryptAttribute`'s signature drops back to Rails'
`encrypt_attribute(name, **options)` shape.

## Acceptance criteria

- [ ] `encryption.ts#buildScheme` is gone; `schemeFor` is the only scheme constructor.
- [ ] `EncryptableRecord.encryptAttribute` no longer takes a scheme-builder parameter.
- [ ] `encryptionHooks.buildScheme` (used by `preserveOriginalEncrypted`) is retired
      with it.
- [ ] The legacy `{ encrypt, decrypt }` shim and the encryption suite stay green on
      all three lanes.
