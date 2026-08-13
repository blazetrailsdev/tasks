---
title: "Export DupCoder#dump_value / #load_value so parity scores them"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6445
claim: "2026-08-12T23:56:50Z"
assignee: "export-dupcoder-dump-value-and-load-value"
blocked-by: null
closed-reason: null
---

## Context

`MemoryStore::DupCoder#dump_value` and `#load_value`
(activesupport/lib/active_support/cache/memory_store.rb:56-70) are implemented in
`packages/activesupport/src/cache/memory-store.ts` (`dumpValue`, `loadValue`
inside `namespace DupCoder`) but are **not exported**, so api-compare scores them
missing: `memory_store.rb` sits at 17/19 with both named as the gap.

They are private in Ruby, but parity counts private members, and every other
`DupCoder` member (`dump`, `dumpCompressed`, `load`) is exported from the
namespace.

## Acceptance criteria

- `dumpValue` / `loadValue` are visible to the extractor at their Rails names
  (export them from the `DupCoder` namespace, matching its other members).
- `pnpm parity:api` activesupport `cache/memory_store.rb` reaches 19/19.
- No behavioral change; existing MemoryStore/DupCoder tests stay green.
