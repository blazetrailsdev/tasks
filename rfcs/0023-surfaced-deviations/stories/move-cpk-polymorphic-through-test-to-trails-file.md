---
title: "join-model: move trails-only CPK polymorphic-through test to a .trails.test.ts file"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Test-file placement cleanup; no divergence from Rails behaviour and the test itself is trails-only by construction."
---

## Context

`packages/activerecord/src/associations/join-model.test.ts` holds a trails-only
test, "polymorphic has many through with composite owner primary key", inside a
Rails-mirroring file (`vendor/rails/activerecord/test/cases/associations/join_model_test.rb`
has no such case — verified by grep). Repo convention puts TS-only extras in a
sibling `*.trails.test.ts`.

It is also un-Rails-able as written: Rails' `Tagging` declares
`belongs_to :taggable, polymorphic: true, counter_cache: :tags_count`
(`vendor/rails/activerecord/test/models/tagging.rb:14`) and `cpk_orders` has no
`tags_count` column in `vendor/rails/activerecord/test/schema/schema.rb`, so the
model create path fails in Rails too. #5373 worked around that by seeding the
join row with `Tagging.insertAll`; moving the case to a `.trails.test.ts` file
puts it where trails-only coverage belongs and documents why it cannot use the
ordinary create path.

## Acceptance criteria

- The test moves verbatim (no rename) to
  `packages/activerecord/src/associations/join-model.trails.test.ts`, with the
  existing `insertAll` comment carried over.
- `join-model.test.ts` contains only Rails-named cases.
- Both files pass; `pnpm parity:test` shows no regression for
  `join_model_test.rb`.
