---
title: "Diagnostic + code-fix remap (parity)"
status: draft
updated: 2026-06-17
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: ["lsp-position-remap-mvp"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-MVP parity. `packages/trails-tsc/src/remap.ts#remapDiagnostics` already
remaps diagnostic spans for the CLI; reuse it in the LSP proxy for
`getSemanticDiagnostics`/`getSyntacticDiagnostics`/`getSuggestionDiagnostics`,
plus code-fix/refactor edit remap (`getCodeFixesAtPosition`,
`getEditsForRefactor`), dropping edits that overlap injected ranges.

## Acceptance criteria

- Editor diagnostics land on the user's original lines/columns/message text,
  matching a hand-declared equivalent.
- Code fixes/refactors produce no edits inside injected `declare` ranges.
- Tests on an error-in-class-body fixture. ≤500 LOC.
