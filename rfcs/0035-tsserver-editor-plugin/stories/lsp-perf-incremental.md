---
title: "Incremental walker + perf budget"
status: draft
updated: 2026-06-17
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: ["lsp-plugin-ar-dispatch"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-MVP. On large repos the walker must not run per keystroke. Re-virtualize
only the changed file on snapshot-version change; rebuild the model registry
only on program-identity change. Hoist the fast pre-filter; memoize the walker
keyed on scanned `ts.SourceFile`s.

## Acceptance criteria

- Per-file incremental snapshot; registry rebuild only on program identity
  change.
- Perf harness over synthetic repos (N∈{10,100,500}); p95 file-open overhead
  under an agreed budget; no per-keystroke walker invocations.
- ≤500 LOC; harness may land as a non-blocking CI job initially.
