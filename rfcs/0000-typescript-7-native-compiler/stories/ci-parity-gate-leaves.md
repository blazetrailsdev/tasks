---
title: "Make parity job blocking for leaf packages"
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

Phase 2 of RFC 0000-typescript-7-native-compiler. Once the leaf packages'
allowlists are curated to a stable, understood set, promote the parity
check from advisory to required for them.

- Leaf packages: `activesupport`, `activemodel`, `actionpack`,
  `actionview`, `arel`, `rack`, `trailties`, `globalid`, `did-you-mean`,
  `html-sanitizer`, `nokogiri`, `tse-compiler`, and the programmatic-API
  consumers as _typecheck-only_ targets (`trails-tsc`, `activerecord-cli`
  must type-check under tsgo even though they keep running on TS 5.x).
- Make the per-package parity result blocking for these; keep
  `activerecord` advisory (handled by the sibling story).

## Acceptance criteria

- Leaf-package parity is a required check; a new off-allowlist divergence
  in any leaf blocks the PR.
- `activerecord` parity remains non-blocking until its own gate story.
