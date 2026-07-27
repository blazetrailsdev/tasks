---
title: "Ruby extractor drops ActiveRecord::Encryption::Cipher (class whose file has a same-named subdirectory)"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing #5427 (`extra-surface-skips-files-without-rails-counterpart`).

`ActiveRecord::Encryption::Cipher` is a plain class defined in
`vendor/rails/activerecord/lib/active_record/encryption/cipher.rb:11` with four
public instance methods (`encrypt` :15, `decrypt` :26, `key_length` :31,
`iv_length` :35). It is MISSING from `scripts/api-compare/output/rails-api.json`:
the only entity extracted from that file tree is the nested
`ActiveRecord::Encryption::Cipher::Aes256Gcm` (from
`encryption/cipher/aes256_gcm.rb`), and `cipher.rb` itself appears only under
`fileConstants` with `DEFAULT_ENCODING`.

Consequence: `packages/activerecord/src/encryption/cipher.ts` reports its four
faithful ports (`encrypt`, `decrypt`, `keyLength`, `ivLength`) as extra surface
in `api:extra` — classed `moved`, since the same names exist on
`aes256_gcm.rb`. They are not moved and not extra; Rails defines them in the
very file the TS file mirrors. api:compare presumably also cannot credit them.

The suspicion is that a class whose file has a same-named _subdirectory_
(`encryption/cipher.rb` + `encryption/cipher/`) is dropped or shadowed by the
nested entity during extraction, but that hypothesis is unverified — start by
reproducing against the extractor, not by assuming the cause.

## Acceptance criteria

- Determine why `ActiveRecord::Encryption::Cipher` is absent from the Ruby
  manifest and fix the extractor so the class and its four methods are recorded
  against `encryption/cipher.rb`.
- Sweep for the same shape elsewhere: every `foo.rb` that has a sibling `foo/`
  directory, checking whether the `foo.rb` entity survived extraction. Report
  the count; fix all of them, not just cipher.
- After the fix, `encryption/cipher.ts` reports 0 extras in `api:extra` and its
  methods are credited by `api:compare`. Check the delta on every package —
  the fix should only ever move surface from extra/missing to matched.
