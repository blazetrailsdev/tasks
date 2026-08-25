---
title: "converge-encryption-config-raising-credential-readers"
status: done
updated: 2026-08-04
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6082
claim: "2026-08-04T18:55:06Z"
assignee: "i18n-time-zone-abbreviation-links"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/encryption/config.rb:35-46` defines
each credential twice: `has_<key>?` returns `instance_variable_get(:"@#{key}").presence`,
and the bare reader `<key>` is

```ruby
public_send("has_#{key}?") or
  raise Errors::Configuration, "Missing Active Record encryption credential: active_record_encryption.#{key}"
```

PR for `port-encryption-config-has-credential-predicates` added the three
`has*` predicates to `packages/activerecord/src/encryption/config.ts`, but the
bare readers there are still plain public fields (`primaryKey`,
`deterministicKey`, `keyDerivationSalt`) that return `undefined` instead of
raising. `parity:api` counts them as matched either way, so the divergence is
invisible to the gates.

The raise currently lives in the trails-only `Config#get(key)` +
`_requiredKeys` pair (config.ts), which has no Rails counterpart and carries a
different message ("Missing encryption key: …").

Blast radius: dozens of read sites snapshot/restore these fields nullishly —
`encryption/test-helpers.ts:52-67`, `encryptor.ts:166`, `scheme.ts:152-157`,
`encryption.ts:159-161`, plus most `encryption/*.test.ts` save/restore blocks.
Converging means routing those through `hasX()` and giving the readers Rails'
raising behaviour, which is why it was split out.

## Acceptance criteria

- [ ] `primaryKey` / `deterministicKey` / `keyDerivationSalt` raise
      `Errors::Configuration` with Rails' exact message when the credential is
      blank, and callers that want the nil-safe read use `hasX()`.
- [ ] The trails-only `Config#get` / `_requiredKeys` machinery is deleted (its
      raise is what the bare readers now do).
- [ ] Encryption suites green on all three lanes.
