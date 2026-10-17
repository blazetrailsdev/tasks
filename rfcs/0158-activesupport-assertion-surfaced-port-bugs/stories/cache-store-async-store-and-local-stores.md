---
title: "cache-store-async-store-and-local-stores"
status: done
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8997
claim: "2026-10-16T23:13:24Z"
assignee: "cache-store-async-store-and-local-stores"
blocked-by: null
closed-reason: null
---

## Context

Split from `cache-store-async-over-npm-clients`. `packages/activesupport/src/cache/store.ts` is synchronous (`fetch`/`read`/`write`/`delete`/`exist`/`readMulti`/`writeMulti`/`fetchMulti`/`deleteMulti`, abstract `readEntry`/`writeEntry`/`deleteEntry`). Every Node memcached/Redis client is async, so the Store must be async before any network store is ported. Rails: `vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb` (Store), `cache/memory_store.rb`, `cache/file_store.rb`, `cache/null_store.rb`. `Notifications.instrument` already handles a Promise block (`notifications/instrumenter.ts:176`). Host `UNIVERSAL_OPTIONS` (`cache.rb:26-38`) in `cache/store.ts`, not `cache.ts` (TDZ, verified in #8057). About 400 call sites in `packages/activesupport/src/cache/**` tests and behaviors need `await`.

## Acceptance criteria

- The Store API and its entry hooks return promises. MemoryStore, FileStore and NullStore are converted. FileStore's bodies moving onto async fs calls is `file-store-async-fs-bodies`.
- The activesupport cache tests and behaviors await them, with test names unchanged.
- Consumers outside activesupport stay compiling: either through `cache-store-async-consumers` landing alongside, or with minimal awaits.
