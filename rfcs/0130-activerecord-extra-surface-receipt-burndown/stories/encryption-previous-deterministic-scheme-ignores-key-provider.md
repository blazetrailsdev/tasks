---
title: "encryption-previous-deterministic-scheme-ignores-key-provider"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while converging `UniquenessValidator#build_relation` onto `where!`
(`vendor/rails/activerecord/lib/active_record/validations/uniqueness.rb:131`) and
`EncryptedUniquenessValidator#validate_each` onto its per-previous-type loop
(`vendor/rails/activerecord/lib/active_record/encryption/extended_deterministic_uniqueness_validator.rb:11-23`).

With `Configurable.config.previous = [{ keyProvider: makeKeyProvider("prev-key-for-uniqueness-test-32b!!"), deterministic: true }]`,
an `encrypts :name, deterministic: true` attribute's `previousTypes[0].serialize("dune")`
returns the byte-identical ciphertext that the current type produces
(`{"p":"0pjptQ==","h":{"iv":"Tv3dqQFgK/+Xef9e","at":"nGYfS/Tb+5YetIRCUyaPgw=="}}` both
times). In Rails, a previous scheme's `key_provider` wins over the deterministic key
(`encryption/scheme.rb` `key_provider`: `@key_provider_param || key_provider_from_key ||
deterministic_key_provider || default_key_provider`), so the previous ciphertext must
differ. Somewhere in `packages/activerecord/src/encryption/scheme.ts` (`keyProvider` getter,
`:95-100`), the `previous:` config merge (`configurable.ts` / `config.ts` previous-schemes
building) or `makeKeyProvider` in `encryption/test-helpers.ts`, the previous key provider
is lost.

Visible effect: the trails-only `previous` setup in
`encryption/uniqueness-validations.test.ts` "uniqueness validation does not revalidate the
attribute with current encryption type" reported 2 errors instead of 1 once the validator
converged. That setup was removed to match the Rails test (`uniqueness_validations_test.rb:59-64`,
which configures no previous scheme), so this bug is not covered right now.

## Acceptance criteria

- A deterministic previous scheme configured with its own `keyProvider` serializes with
  that provider, so its ciphertext differs from the current scheme's.
- A regression test pins it, using the Rails encryption test helpers' shapes.
