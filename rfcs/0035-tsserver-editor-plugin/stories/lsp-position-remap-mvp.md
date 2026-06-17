---
title: "Position remap for definition/quickInfo/completions (MVP)"
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

Synthesized declares shift line numbers; `virtualize()` already returns a
`deltas` table and `remapLine()` (`type-virtualization/virtualize.ts:370`)
inverts it. IDE features must return spans in the user's ORIGINAL coordinates.
MVP scope is the three navigation/info features: definition, quickInfo,
completions. Also confirm auto-import (`prependImports`) carries through the
snapshot so go-to-def on an injected `import type` resolves (RFC Open Q2).

## Acceptance criteria

- `virtualToOriginal` / `originalToVirtual` helpers over `deltas`.
- LanguageService proxy remaps for `getDefinitionAtPosition`,
  `getQuickInfoAtPosition`, `getCompletionsAtPosition` (+ entry details).
- Tests on the auto-import fixture: hover/def spans point at the literal
  identifier in the original file; go-to-def on an auto-imported target jumps to
  its module. ≤500 LOC. Diagnostics/rename/outline are out of scope (deferred).
