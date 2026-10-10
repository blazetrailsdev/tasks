---
title: "activerecord: Preloader LoaderRecords#keys_to_load compares composite keys by identity"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8751
claim: "2026-10-10T11:39:39Z"
assignee: "compatibility-module-members-unmeasured-by-parity-api"
blocked-by: null
closed-reason: null
---

## Context

`Preloader::Association::LoaderRecords` holds `@keys_to_load = Set.new`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/association.rb:64`)
and removes the already-loaded keys with `@keys_to_load.subtract(already_loaded_records_by_key.keys)`
(`:88`). A Ruby `Set` compares members by `eql?`, so a composite key `[1, 2]` from one loader is the
same member as `[1, 2]` from another.

trails' `keysToLoad` is a JS `Set`
(`packages/activerecord/src/associations/preloader/association.ts`, `LoaderRecords`), which compares
an Array by identity. Since `deriveKey` returns Rails' Array for a composite key (the same PR that
filed this story dropped the `JSON.stringify` spelling), two loaders that share a composite key
contribute two members, and the `subtract` loop only deletes the instance stored in
`alreadyLoadedRecordsByKey` (a ruby-compat `Hash`, which does key by `eql?`). The other loader's
equal key stays in `keysToLoad`, so `load_records_for_keys` can issue a query Rails would skip.
Single-column keys are primitives and are unaffected.

ruby-compat has no `Set` keyed by `eql?`; `Hash` is the only `eql?`-keyed container.

## Acceptance criteria

- [ ] `LoaderRecords#keysToLoad` deduplicates and subtracts composite keys by `eql?`, through a
      ruby-compat `Set` port (MRI `set.rb` keeps its members in a `Hash`) or whatever settled
      `eql?`-keyed set the repo has by then.
- [ ] A test with two loaders sharing a composite key, one of whose owners is already loaded,
      shows the shared key absent from `keysToLoad`.
