---
title: "encrypts-accepts-previous-option"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
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

Rails' `EncryptableRecord#scheme_for` takes `previous: []` as a keyword
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb`),
so `encrypts :token, previous: { deterministic: false }` declares per-attribute
previous schemes. trails' `schemeFor` (`packages/activerecord/lib/encryption/encryptable-record.ts:52-57`)
destructures `previousSchemes` instead, and `SchemeOptions`
(`packages/activerecord/lib/encryption/scheme.ts:12`) has no `previous` key, so the Rails
option is unreachable. Found writing the Encryption guide (trails#10447).

## Acceptance criteria

- [ ] `encrypts(name, { previous: ... })` accepts a scheme-options object or array, as Rails' `previous:` does, building `Scheme`s from it.
- [ ] The Encryption guide gains the per-attribute `previous` example.
