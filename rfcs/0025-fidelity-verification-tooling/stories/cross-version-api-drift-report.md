---
title: "Cross-version Rails API drift report (upgrade worklist), scoped to ported surface"
status: ready
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A spike (`scripts/api-compare/version-diff.ts`, built alongside trails PR #4002
but not committed) diffs two Ruby API manifests produced by
`scripts/api-compare/extract-ruby-api.rb` at two different Rails refs, yielding
an upgrade worklist: classes added/removed, per-method signature changes,
visibility flips, and a coarse call-set (body) delta via the `calls` array. It
was validated end-to-end on v8.0.2 → v8.1.3 activerecord (18 classes added, 5
removed, 33 signature changes, 230 call-set changes) by hand-feeding
`LIB_PATHS_JSON` pointed at a sparse clone of the target tag.

We are pinned to `v8.0.2` (`vendor/sources.ts` / `vendor/sources.lock.json`)
while upstream is on 8.1.x; a repeatable drift report is the cheapest way to
scope each future bump. The TS-side `calls`/surface data now exists (PR #4002),
so the drift can be intersected against _our ported surface_.

## Acceptance criteria

- An on-demand `api:drift`-style entrypoint (flag/env, e.g. `--ref <tag>`) that
  fetches the target ref reproducibly (own lock entry; keep `v8.0.2` as the
  single canonical active pin — no permanent second source) and produces
  `output/rails-api@<ref>.json`, then a structured `output/version-drift.json`.
- Drift is filtered/annotated against the TS manifest so "drift in methods we
  ported" is separable from drift in unported surface.
- The diff core is a pure, unit-tested module (added/removed/changed,
  signature + call-set dimensions), mirroring `version-diff.ts`.
- Docs: a short note on running it before a Rails bump.

## Out of scope

- Auto-generating TS from the Ruby AST (separate, larger effort).
- Bumping the canonical pin to 8.1.x (a decision, not this tool).
