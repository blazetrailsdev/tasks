---
title: "file-store-async-fs-bodies"
status: draft
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport", "ruby-compat"]
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

Split from `cache-store-async-store-and-local-stores` (trails#8997). That PR made `ActiveSupport::Cache::FileStore` async at its API (`packages/activesupport/src/cache/file-store.ts`), but its bodies still call ruby-compat's sync fs: `File.isExist`, `File.binread` (`readSerializedEntry`), `atomicWrite` (`writeSerializedEntry`), `File.delete`, `File.realpath`, `Dir.children` / `Dir.delete` (`deleteEmptyDirectories`), `FileUtils.makedirs` (`ensureCachePath`), `FileUtils.rmR` (`clear`), `File.isDirectory` (`searchDir`) and `File.open` + `flock` (`lockFile`). Rails' bodies are in `vendor/rails/v8.0.2/activesupport/lib/active_support/cache/file_store.rb`.

ruby-compat already has `File.isExistAsync`, `File.deleteAsync`, `File.writeAsync`, `Dir.childrenAsync`, `FileUtils.mkdirPAsync` and `FileUtils.rmRAsync`. It has no async `binread`, `open`, `realpath`, `isDirectory` (only the module-private `isDirectoryAsync` in `dir.ts`), and no async `atomicWrite` (`activesupport/src/core-ext/file/atomic.ts`).

`searchDir` reads `Dir.childrenAsync` where Rails calls `Dir.each_child` (`file_store.rb:208-218`), and carries `@missingRailsCall each_child — CONVERGEABLE file-store-async-fs-bodies`.

## Acceptance criteria

- Every FileStore body awaits an async ruby-compat fs call. No sync fs call remains in `file-store.ts`.
- Any async ruby-compat API this needs is added, with its MRI citation.
- The `@missingRailsCall each_child` receipt is resolved: either an async `Dir.eachChild` is ported, or the receipt is ratified.
- `stores/file-store.test.ts` and `file-store-atomic-write.trails.test.ts` stay green.
