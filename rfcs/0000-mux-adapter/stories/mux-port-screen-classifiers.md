---
title: "Port the screen classifiers and string helpers to `lib/mux/screen.ts`"
status: draft
updated: 2026-10-28
rfc: "0000-mux-adapter"
cluster: mux-foundation
packages: []
deps:
  - mux-parity-screen-corpus-and-go-dump
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Pure functions, ported 1:1. This is gate G1.

## Acceptance criteria

- [ ] `lib/mux/screen.ts` exports each function named in the RFC's **`Fleet` and screen classifiers** section
- [ ] A vitest suite runs them over `parity/screens/` and matches `expected.json` exactly on every screen (G1)
- [ ] CI fails if `expected.json` is newer than the last TS run, so the two sides can't drift silently
