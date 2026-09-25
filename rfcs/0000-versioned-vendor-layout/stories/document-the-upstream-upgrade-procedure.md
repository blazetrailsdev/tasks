---
title: "Document the upstream upgrade procedure"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps:
  - fetch-a-candidate-version-beside-the-active-one
  - gate-unversioned-and-stale-vendor-citations
  - pin-the-body-hash-floor-before-the-first-bump
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

- `vendor/README.md` gains an upgrade section with the ordered procedure: fetch the
  candidate beside the active version (`--ref`), diff the two trees, bump `ref` in
  `vendor/sources.ts`, re-fetch, run `pnpm vendor:recite`, read **both** worklists —
  the citation gate's stale list and `lint-body-pins.ts`'s DRIFT rows — re-verify
  and re-pin (`body-pins.ts --pin <ruby-file>`), then `--prune`.
- It says which of the two worklists answers which question (a stale citation means
  the path moved; a drifted pin means the body changed) and that a green citation
  gate is not evidence a port is still faithful.
- It states what the parity gates are expected to do across a bump (deltas move,
  baselines are only-shrink, a new upstream method surfaces as missing rather than
  as extra) and that the sweep is its own commit.
- It records the disk cost of coexistence (~53 MiB per clone) and that `--prune`
  is manual.
- It names the registry as the only place a vendor path is built, so a future
  script does not reintroduce a literal.
- CLAUDE.md's `vendor/rails/` sentence points at it, and its citation convention
  sentence matches the gate.
