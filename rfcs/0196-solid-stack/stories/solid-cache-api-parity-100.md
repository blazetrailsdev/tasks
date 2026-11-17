---
title: "solid-cache parity:api reaches 100% (MaglevHash helpers, wrap_in_rails_executor)"
status: done
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-cache"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10202
claim: "2026-11-16T19:06:40Z"
assignee: "solid-cache-test-compare-credits-shared-behaviors"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package solid-cache` (2026-11-16) reads 241/248 (97.2%). Missing:

- `maglev_hash.rb`: `node_count`, `preferred_free_slot`, `rank`, `preferred_slots`, `next_slot` (private helpers of `SolidCache::MaglevHash`).
- `store.rb` and `store/execution.rb`: `wrap_in_rails_executor`.

## Acceptance criteria

- Each method exists at its Rails name, with the module and shape Rails gives it. MaglevHash's population uses Rails' helper split, not an inlined loop.
- `wrap_in_rails_executor` goes through the app executor the way `store/execution.rb` does.
- `parity:api --package solid-cache` reads 100%.
