---
title: "atomic-write-async-fs"
status: draft
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Split from `file-store-async-fs-bodies`. Every `ActiveSupport::Cache::FileStore` body now awaits ruby-compat's async fs except `writeSerializedEntry` (`packages/activesupport/lib/cache/file-store.ts`), which still calls the sync `atomicWrite` (`packages/activesupport/lib/core-ext/file/atomic.ts`), as Rails' `write_serialized_entry` calls `File.atomic_write(key, cache_path) { |f| f.write(payload) }` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/file_store.rb:118-123`). `lockFile` also still calls the sync `File#flock` (backend `flockSync`) inside `File.openAsync`.

`atomicWrite` mirrors `vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/file/atomic.rb:21-49`, and every step is sync: `Tempfile.open` (`packages/ruby-compat/lib/tempfile.ts`, `openExclusive`), the tempfile's `File#write`, `File.isExist` / `File.stat`, `probeStatIn`'s `FileUtils.touch` / `rmF`, `File.chown` / `File.chmod` and `File.rename`. ruby-compat has no async `Tempfile.open`, `File#write`, `File.stat`, `File.rename` or `flock`.

## Acceptance criteria

- ruby-compat gains the async `Tempfile.open`, tempfile write, `File.stat`, `File.rename` and `flock` this needs, each with its MRI citation.
- `atomicWrite` (or an async sibling at the Rails name) awaits only async fs, and `FileStore#writeSerializedEntry` / `#lockFile` await it.
- `stores/file-store.test.ts` and `file-store-atomic-write.trails.test.ts` stay green.
