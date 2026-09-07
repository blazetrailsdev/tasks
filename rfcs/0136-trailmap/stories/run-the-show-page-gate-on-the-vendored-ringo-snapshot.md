---
title: "Move the show-page gate onto the vendored ringo snapshot so CI can run it"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two gates now diff trailmap against ringo, and they reach ringo two different
ways:

- `pnpm gate:pages` (#17) asks the RUNNING ringo over HTTP. It cannot run in
  CI — "ringo serves from a checkout and a database that exist only on the
  box" — so it is a manual gate with a deadline, and it stops being runnable
  at all once ringo's read model is deleted
  (`land-the-ringo-read-model-deletion`).
- `pnpm gate:lists` / `pnpm gate:markdown` (#18) run ringo's own CODE, vendored
  verbatim under `vendor/ringo/` at a pinned commit, so they need no ringo
  running and are merge conditions in CI.

The second approach removes the first's constraint, and the show pages are the
part with the deadline. ringo's `/rfc/<id>` and `/story/<id>` are Go
`html/template` handlers rather than browser scripts, so this is not the same
extraction — the vendored side needs the template plus the row assembly, or a
harness that renders one page's values to JSON the way
`vendor/ringo/go/harness.go` does for `markdown` and `counts`.

## Expected shape

Extend `scripts/vendor-ringo.sh` and `vendor/ringo/go/` to cover the show-page
handlers, then re-point `scripts/page-equivalence.ts`'s ringo side at the
vendored harness instead of `RINGO_BASE`, keeping `page-extract.ts` as the
value extractor. It joins the `gate` job beside the other two.

## Acceptance criteria

- The show-page comparison runs in CI, with no ringo server reachable.
- It survives ringo's read-model deletion, since it needs only the pin.
- The expected divergence #17 documents (ringo 404s a story under a closed RFC,
  trailmap renders it) is still counted rather than failed.
