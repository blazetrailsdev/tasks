---
title: "file-store-converge-to-second-unit-entry-storage"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T23:42:42Z"
assignee: "file-store-converge-to-second-unit-entry-storage"
blocked-by: null
---

## Context

Sibling of `cache-stores-converge-to-second-unit-entry-storage`, which converged
`MemoryStore` (and the base `Cache::Store`) to Rails second-unit `Entry` storage
and moved `race_condition_ttl` into the base `handleExpiredEntry`
(`packages/activesupport/src/cache/store.ts`,
`packages/activesupport/src/cache/memory-store.ts`). That PR deferred `FileStore`
to keep under the 500-LOC ceiling.

`FileStore` (`packages/activesupport/src/cache/file-store.ts`) still keeps its
**bespoke millisecond-unit storage model**: it overrides every public method
(`read`/`write`/`delete`/`exist`/`fetch`/`*Multi`) re-wrapping ms-based bodies and
stores the `entry-record.ts` `CacheEntry` (`expiresAt` in epoch-ms via
`Date.now() + options.expiresIn`) rather than Rails' second-unit `Entry`
(`entry.ts`, `expiresIn*1000`).

Rails `FileStore` subclasses `Store`, overrides only the private
`read_entry`/`write_entry`/`delete_entry` hooks plus the file-layout helpers
(`clear`/`cleanup`/`delete_matched`/`increment`/`decrement`), and inherits the
instrumented public methods (`file_store.rb`, cache.rb:1002-1030). `MemoryStore` is
now the in-repo model for this conversion (entry hooks store a coder-serialized
record; readEntry/writeEntry rebuild a second-unit `Entry`).

## Acceptance criteria

- `FileStore` stores Rails `Entry` objects (second-unit `expiresIn`) and inherits
  the base `read`/`write`/`delete`/`exist?`/`fetch`/`*Multi` public methods
  instead of re-wrapping bespoke millisecond bodies; only the entry hooks and the
  file-layout helpers (clear/cleanup/deleteMatched/increment/decrement, keyToPath,
  `FILENAME_MAX_SIZE`) remain overridden.
- `unlessExist` handling moves into `writeEntry` (as in `MemoryStore`).
- File layout (nested dirs, `FILENAME_MAX_SIZE` chunking, `.gitkeep`/`.keep`
  preservation on clear) preserved.
- Bespoke `stores/file-store.test.ts` and the `FileStore` section of
  `cache.test.ts` converted from ms to second units.
- Hard rules: NO `node:*` imports, NO `process.*` refs, async-fs-only conventions,
  no new runtime deps.
- api:compare / test:compare delta non-negative. 500-LOC ceiling, single PR.
