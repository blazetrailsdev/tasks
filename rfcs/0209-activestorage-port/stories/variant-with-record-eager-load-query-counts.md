---
title: "variant-with-record-eager-load-query-counts"
status: in-progress
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9710
claim: "2026-11-04T00:58:14Z"
assignee: "variant-with-record-eager-load-query-counts"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/test/models/variant_with_record_test.rb` asserts
query counts while walking representations. In
`packages/activestorage/src/variant-with-record.test.ts`:

- "eager loading has_one_attached record" (`:59-123`): the
  `users.with_attached_cover_photo.each` block runs 7 queries where Rails asserts 6.
  Trails issues the variant-record image attachments' blobs and the cover blobs as
  two separate `active_storage_blobs` SELECTs.
- "eager loading has_many_attached records" (`:179-317`): the
  `assert_queries_match(/SELECT/i, count: 10)` block runs 8 SELECTs where Rails runs
  10 (the reload inside `VariantWithRecord#key` after creating a new variant).

Both tests are `it.skip` under `BLOCKED: variant-with-record-eager-load-query-counts`.

## Acceptance criteria

- Trace each block against Rails' `Preloader::Batch`
  (`activerecord/lib/active_record/associations/preloader/batch.rb`) and
  `VariantWithRecord#record` / `#key`
  (`activestorage/app/models/active_storage/variant_with_record.rb`) and converge
  the implementation so the counts match.
- Both tests are un-skipped and pass.
