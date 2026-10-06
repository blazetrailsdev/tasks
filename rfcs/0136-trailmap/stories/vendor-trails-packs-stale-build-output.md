---
title: "trailmap: vendor-trails.sh packs stale build output left in the trails checkout"
status: draft
updated: 2026-10-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found vendoring trailmap#39. `scripts/vendor-trails.sh` packs whatever is in the trails checkout's
`packages/*/dist`, and `tsc --build` never deletes an output whose source is gone. So a checkout
that was built at another commit first packs leftovers:

- The `blazetrails-activemodel` tarball on `main` before #39 carried `dist/validations/_accessor.*`,
  four files with no source at the pin and no importer.
- The first attempt at #39 packed `dist/thor/*.test.*` files into `blazetrails-trailties`, left from
  a build of a later commit in the same checkout.

Both went away after `git clean -fdx` on the checkout's build output and a rebuild. The script's
claim that re-running it reproduces the committed `vendor/` holds only from a clean tree, and
nothing checks that.

## Acceptance criteria

- [ ] `scripts/vendor-trails.sh` packs from a clean build: it removes each package's `dist` and rebuilds, or refuses a checkout whose `dist` holds a file with no source.
- [ ] Running it twice in a row, with a build of a different commit in between, yields byte-identical tarballs.
