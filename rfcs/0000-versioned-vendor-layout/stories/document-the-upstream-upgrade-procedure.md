---
title: "Document the upstream upgrade procedure"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [fetch-a-candidate-version-beside-the-active-one,gate-unversioned-and-stale-vendor-citations]
deps-rfc: []
est-loc: 120
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The layout exists to make an upgrade startable; the procedure that uses it is
currently nowhere. `vendor/README.md` documents the sources and `pnpm vendor:fetch`,
and CLAUDE.md § "Working in this repo" says the Rails source of truth is vendored
at `vendor/rails/` and refreshed with `pnpm vendor:fetch` — neither describes
bumping a ref. Docs-only, so exempt from the LOC ceiling.

## Acceptance criteria

- `vendor/README.md` gains an upgrade section: fetch the candidate beside the
  active version (`--ref`), diff the two trees, bump `ref` in `vendor/sources.ts`,
  re-fetch, run `pnpm vendor:recite`, read the citation gate's stale list as the
  re-verification worklist, then `--prune`.
- It states what the parity gates are expected to do across a bump (deltas move,
  baselines are only-shrink, a new upstream method surfaces as missing rather than
  as extra) and that the sweep is its own commit.
- It records the disk cost of coexistence (~53 MiB per clone) and that `--prune`
  is manual.
- CLAUDE.md's `vendor/rails/` sentence points at it, and its citation convention
  sentence matches the gate.
