---
title: "converge-base-query-cache-and-encryption-facade-bodies"
status: claimed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-26T23:50:56Z"
assignee: "converge-base-query-cache-and-encryption-facade-bodies"
blocked-by: null
closed-reason: null
---

## Context

Fallout cluster from the #5334 include-resolution reseed, surviving the
delegation-transparency gate added by
`burn-down-mixin-driven-wide-ratchet-expansion`. 15 entries in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/base.json` for
two modules included into `ActiveRecord::Base`: `QueryCache::ClassMethods` and
`Encryption::EncryptableRecord`.

Anchors: `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb`
and `.../encryption/encryptable_record.rb`.

- `cache` drops `configurations`, `connected?`, `enable_query_cache`; `uncached`
  drops `configurations`, `connected?`, `disable_query_cache`. Rails walks
  `configurations` and only toggles the cache on pools that are `connected?`;
  the trails port appears to toggle unconditionally, which changes behaviour for
  multi-database apps (it can force a connection on an idle pool).
- `encrypt` / `decrypt` drop `has_encrypted_attributes?` and
  `encrypt_attributes` / `decrypt_attributes` — Rails short-circuits when the
  record has no encrypted attributes.
- `encrypted_attribute?` drops `encrypted?`, `encrypted_attributes`,
  `include?`, `read_attribute_before_type_cast`, `type_for_attribute`. Rails
  answers this by asking the _stored value_ whether it is encrypted, reading the
  before-type-cast attribute; see
  [[project_support_unencrypted_data_masks_expansion_ciphertext_bugs]] before
  changing it.

## Acceptance criteria

- Converge `cache` / `uncached` to walk `configurations` and skip
  not-yet-`connected?` pools, matching Rails.
- Converge `encrypt` / `decrypt` / `encrypted_attribute?` onto the Rails bodies.
- Add a regression test for the idle-pool case (a second configured database
  must not be connected by `Model.cache { }`) that fails on the current
  implementation.
- Entries drop out of `call-mismatches-wide-exclude/activerecord/base.json`;
  `pnpm api:calls:wide` passes with a strictly smaller baseline.
- Tests named verbatim after
  `vendor/rails/activerecord/test/cases/query_cache_test.rb` and
  `.../encryption/encryptable_record_test.rb`.

Ship query-cache and encryption as two PRs if the combined diff exceeds 500 LOC;
register the second half as a follow-up story rather than stacking.
