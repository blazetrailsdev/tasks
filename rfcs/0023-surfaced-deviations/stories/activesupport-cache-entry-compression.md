---
title: "activesupport: implement Cache::Entry compression (entry.rb:33-35, 76-98)"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-19T02:00:26Z"
assignee: "activesupport-cache-entry-compression"
blocked-by: null
---

## Context

`packages/activesupport/src/cache/entry.ts` `Entry` class was added in PR #3612. Rails `entry.rb:33-35` decompresses `@value` in the `value` getter when `compressed?` is true; `entry.rb:76-98` implements `compressed(compress_threshold)` using `Zlib::Deflate`. The TS port omits the `compressed` constructor option entirely because `node:zlib` imports are prohibited by the story's hard rules.

Rails source: `vendor/rails/activesupport/lib/active_support/cache/entry.rb:25-98`
TS file: `packages/activesupport/src/cache/entry.ts`

## Acceptance criteria

- [ ] `Entry` constructor accepts `compressed: boolean` option (matching `entry.rb:25`)
- [ ] `value` getter decompresses when `compressed` flag is true (matching `entry.rb:33-35`)
- [ ] `isCompressed()` reflects the flag faithfully
- [ ] Uses activesupport's `gzip.ts` or equivalent (no direct `node:zlib` import)
