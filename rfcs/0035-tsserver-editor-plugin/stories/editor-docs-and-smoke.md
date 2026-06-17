---
title: "Editor install docs + tsserver smoke; supersede plan Phase 2"
status: draft
updated: 2026-06-17
rfc: "0035-tsserver-editor-plugin"
cluster: null
deps: ["lsp-position-remap-mvp", "lsp-diagnostic-remap", "lsp-perf-incremental"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-MVP closeout. Document install for tier-1 editors (VS Code, Zed,
WebStorm) — all via one `plugins` entry in `tsconfig.json` (already merged by
`tsconfig-merge.ts`) — plus Neovim tier-2. Add a tsserver smoke test
(`typescript/lib/tsserver.js`, no editor) asserting open-file → quickInfo
roundtrip; pin the tested TS range. Flip the "in flight" notes in the root
README (line 69) and `packages/activerecord/README.md`. Supersede Phase 2 of
`docs/infrastructure/virtual-source-files-plan.md` with a pointer to this RFC.

## Acceptance criteria

- `docs/editor-setup.md` covers tier-1 editors + TS compatibility note.
- tsserver smoke test green; runs in CI.
- README "in flight" notes updated; plan doc Phase 2 superseded. Docs-heavy
  (exempt from LOC ceiling for .md), but keep code ≤500 LOC.
