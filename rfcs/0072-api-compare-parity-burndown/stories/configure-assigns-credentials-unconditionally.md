---
title: "configure-assigns-credentials-unconditionally"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6104
claim: "2026-08-04T23:35:04Z"
assignee: "i18n-date-complete-frags-weeknum-entries"
blocked-by: null
closed-reason: null
---

# `Configurable.configure` skips undefined keys where Rails assigns them

## Context

`ActiveRecord::Encryption::Configurable.configure`
(vendor/rails/activerecord/lib/active_record/encryption/configurable.rb:20-23)
assigns the three credentials **unconditionally**:

```ruby
def configure(primary_key: nil, deterministic_key: nil, key_derivation_salt: nil, **properties)
  config.primary_key = primary_key
  config.deterministic_key = deterministic_key
  config.key_derivation_salt = key_derivation_salt
```

so a `configure` call that omits `deterministic_key` **clears** any previously
configured one. `packages/activerecord/src/encryption/configurable.ts`'s
`configure` guards each with `if (options.X !== undefined)`, so an omitted key
silently keeps the old credential. That is the kwarg trap in
CLAUDE.md ("a caller forwarding an absent kwarg silently gets the default where
Ruby would have seen `nil`"), and it changes which key material a partial
reconfigure leaves installed.

Found while porting the `support_sha1_for_non_deterministic_encryption` writer
in PR #6094; out of that story's scope.

## Converged shape

Assign all three unconditionally, matching configurable.rb:21-23. Callers that
relied on the sticky behaviour pass the credential explicitly.

## Acceptance criteria

- [ ] `configure` assigns `primaryKey` / `deterministicKey` /
      `keyDerivationSalt` unconditionally, clearing on omission.
- [ ] Encryption suites green on all three lanes; any test that depended on
      the sticky behaviour passes the credential instead of being reshaped.
