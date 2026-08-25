---
title: "converge-memory-store-dupcoder-and-pruning-guard"
status: done
updated: 2026-08-12
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6435
claim: "2026-08-12T20:16:53Z"
assignee: "converge-memory-store-dupcoder-and-pruning-guard"
blocked-by: null
closed-reason: null
---

## Context

Triaged in the `triage-partially-ported-out-of-closure-activesupport-residue`
PR. `ActiveSupport::Cache::MemoryStore::DupCoder` (memory_store.rb:29-70) has
five members; trails' `DupCoder` namespace
(packages/activesupport/src/cache/memory-store.ts) ports only `dump`/`load`, and
ports them as a `structuredClone` shim rather than the Rails bodies. Missing:

- `dump_compressed(entry, threshold)` — memory_store.rb:40-43 (`entry.compressed(threshold)`,
  falling back to `dump`); needs `Cache::Entry#compressed` / `compressed?`.
- `dump_value` / `load_value` — memory_store.rb:57-70, the `Marshal` round-trip
  that keeps a stored String from aliasing the caller's.

Rails' `dump` also rebuilds a `Cache::Entry` with `expires_at`/`version`
preserved (memory_store.rb:32-38), which the structuredClone shim does not do.

Also in this file: `pruning?` (memory_store.rb:132-135) — the reentrancy flag
`prune` sets around itself (`return if pruning?`). trails' `prune`
(memory-store.ts) has no guard at all, so this is a real behavioural gap, not a
Ruby-only member.

## Acceptance criteria

- `DupCoder.dump`/`load` carry the Rails bodies, with `dumpCompressed`,
  `dumpValue` and `loadValue` alongside them.
- `prune` sets and clears the pruning flag and returns early when `isPruning()`.
- `pnpm parity:api` delta non-negative.
