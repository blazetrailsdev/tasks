---
title: "activerecord: LoaderQuery#load_records_in_batch omits loader.run"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LoaderQuery#load_records_in_batch`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/association.rb:32-39`):

```ruby
raw_records = records_for(loaders)

loaders.each do |loader|
  loader.load_records(raw_records)
  loader.run
end
```

`packages/activerecord/src/associations/preloader/association.ts` `loadRecordsInBatch` calls
`loader.loadRecords(rawRecords)` only and never `loader.run()`. The loaders are run afterwards by
`Batch#call`'s `target_loaders.each(&:run)` (`preloader/batch.rb:29`), so the result is the same for a
loader in `target_loaders`, but the body drops a call Rails makes and `run`'s ordering against the
other loaders in the batch differs.

Seen while converging the preloader in trails#8479.

## Acceptance criteria

- [ ] `loadRecordsInBatch` awaits `loader.run()` after `loader.loadRecords(rawRecords)`, as `:35-38` does.
- [ ] Any baseline row or `@missingRailsCall` receipt for the omitted `run` is deleted.
- [ ] `associations.test.ts` (PreloaderTest) and `associations/eager.test.ts` pass with unchanged query counts.
