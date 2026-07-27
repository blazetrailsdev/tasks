---
title: "Port Encryption::Config's three has_*? credential predicates"
status: draft
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5435, which taught the Ruby extractor to record `define_method`
surface. Three `ActiveRecord::Encryption::Config` predicates were previously
invisible to `api:compare` and are now standing misses:

```text
encryption/config.rb → encryption/config.ts   33  3  36  92%
  - has_key_derivation_salt? → hasKeyDerivationSalt
  - has_primary_key?         → hasPrimaryKey
  - has_deterministic_key?   → hasDeterministicKey
```

`vendor/rails/activerecord/lib/active_record/encryption/config.rb:35-46`:

```ruby
%w(key_derivation_salt primary_key deterministic_key).each do |key|
  silence_redefinition_of_method "has_#{key}?"
  define_method("has_#{key}?") do
    instance_variable_get(:"@#{key}").presence
  end

  silence_redefinition_of_method key
  define_method(key) do
    public_send("has_#{key}?") or
      raise Errors::Configuration, "Missing Active Record encryption credential: active_record_encryption.#{key}"
  end
end
```

Note the two halves differ: the `has_*?` predicate returns `.presence` (so it is
the nil-safe reader), while the bare `key` reader **raises**
`Errors::Configuration` when the credential is absent. Only the `has_*?` half is
missing in trails — check whether the bare readers
(`keyDerivationSalt` / `primaryKey` / `deterministicKey`) in
`packages/activerecord/src/encryption/config.ts` currently implement the raising
behaviour or silently return nullish, since the extractor cannot see the
raise-vs-presence split and `api:compare` counts the bare readers as matched
either way.

## Acceptance criteria

- `config.ts` gains `hasKeyDerivationSalt`, `hasPrimaryKey`,
  `hasDeterministicKey`, each returning the presence of the backing field
  (Rails `.presence`: blank string and nil both fall through as absent).
- The bare readers are verified against Rails' `or raise
Errors::Configuration` behaviour and converged if they diverge.
- `pnpm api:compare --package activerecord` shows `encryption/config.rb` with
  no missing methods.
- Test names match Rails verbatim.
