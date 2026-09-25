---
title: "Pin the body-hash floor before the first bump"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 140
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/body-pins.ts` (RFC 0025) records a matched pair's normalized
Rails body digest so that a Rails bump turns a changed upstream body into a DRIFT
report instead of a silently rotten port; `lint-body-pins.ts` gates it as the CI
"Body-pins gate" step. Its documented policy is ORGANIC until first release — pins
grow through the stories that verify pairs, and the whole-surface `--pin-all`
floor is deferred (`body-pins.ts:40-43`). `scripts/api-compare/body-pins.json` is
`[]` today.

That deferral was safe while the vendored tree never moved. It is the thing to
revisit now: a bump with an empty manifest reports no drift at all, so every
ported body reads as unaffected and there is no worklist. Taking the floor *before*
the bump is the cheapest it will ever be — the current tree is the de-facto
baseline every existing port was written against.

This is independent of the layout change and can land in parallel.

## Acceptance criteria

- A decision is recorded in the RFC changelog: `--pin-all` floor now, or a named
  subset (e.g. pairs already verified by a convergence story). The story ships
  whichever it records.
- If the floor is taken: `body-pins.json` is regenerated with `--pin-all` against
  `v8.0.2`, `lint-body-pins.ts` is green, and the manifest records which version
  it was pinned against so a later reader can tell.
- The pinning run is reproducible: a second `--pin-all` on the same tree produces
  a byte-identical manifest.
- `body-pins.ts`'s "Adopted policy: ORGANIC until first release" paragraph is
  updated to say what actually happened, and `vendor/README.md`'s upgrade section
  (or this story's PR body, if that story has not landed) states that re-pinning
  is a step of every bump.
- The manifest's size does not break the Body-pins gate's runtime in CI (report the
  measured step duration in the PR body).
