---
title: "Make parity job blocking for activerecord"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["ci-parity-job-non-blocking"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 2 of RFC 0000-typescript-7-native-compiler. `activerecord` is the
giant (~170k source LOC) and the likeliest source of divergence, so it
gets its own gate story separate from the leaves.

- Curate the `activerecord` allowlist to a stable, fully-understood set
  (every entry links to an upstream issue or a documented-intentional
  tsgo behavior).
- Promote the `activerecord` per-package parity result to required.

## Acceptance criteria

- `activerecord` parity is a required check.
- Its allowlist is empty or every entry is justified with a linked
  upstream issue / documented tsgo intentional-difference.
