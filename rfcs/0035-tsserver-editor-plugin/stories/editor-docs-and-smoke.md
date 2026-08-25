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
roundtrip; pin the tested TS range. Flip the "in flight" notes — re-verified 2026-08-09: root `README.md:69` still
says "the Phase-2 tsserver plugin is in flight",
`packages/activerecord/README.md:161` still says "which is still in flight; the
command-line `trails-tsc` check works today",
`docs/infrastructure/virtual-source-files-plan.md:3,13,315` still lists Phase 2
as open, and `docs/editor-setup.md` does not exist. Supersede Phase 2 of
`docs/infrastructure/virtual-source-files-plan.md` with a pointer to this RFC.

## Acceptance criteria

- `docs/editor-setup.md` covers tier-1 editors + TS compatibility note.
- tsserver smoke test green; runs in CI.
- README "in flight" notes updated; plan doc Phase 2 superseded. Docs-heavy
  (exempt from LOC ceiling for .md), but keep code under the LOC ceiling.
