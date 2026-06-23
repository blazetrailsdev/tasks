---
title: "website: repoint _media-copy links that resolve to the wrong generated page"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: null
claim: "2026-06-23T02:35:15Z"
assignee: "website-media-copy-wrong-target-links"
blocked-by: null
---

## Context

PR #3549 (merged) fixed the VitePress "34 dead links" build failure by repointing
dead `_media` links at GitHub URLs in `packages/website/scripts/escape-typedoc.mjs`.
A Codex review found a residual correctness gap that merged **unfixed**: the rewriter
only acts on links VitePress flags as _dead_ (`isDeadLink === true`). A relocated
verbatim link in a flattened `_media` copy can coincidentally resolve to a _different_
existing generated page, so VitePress does not flag it and it is left pointing at the
wrong doc.

Concrete case: `examples/twitter-clone/README.md:155` has
``[`trails-tsc`](../../README.md#zero-declare-models--trails-tsc)`` (repo root README).
typedoc copies the file to `docs/api/_media/twitter-clone/README.md`; from that depth-2
location `../../README.md` resolves to `docs/api/README.md` (the generated API index,
which **exists**) — wrong doc, and the `#zero-declare…` anchor does not exist. The
depth-1 copy `_media/README-2.md` does not collide, so it _was_ repointed; only nested
copies hit this.

Root cause: `escape-typedoc.mjs` gates rewriting on `isDeadLink`. In a `_media` copy
every verbatim link's in-place target is meaningless and must be resolved against the
content origin regardless of dead/alive.

Known fix (implemented + verified locally, not yet on a branch, ~40 LOC incl. tests):
add `isMediaCopy(fileDir)` and `resolveGeneratedLink(url, fileDir, ctx, dead)` — for
`_media` copies repoint mappable verbatim links via origin resolution even when not
dead; outside `_media` (typedoc-managed index pages) keep the dead-only gate. After the
fix `twitter-clone/README.md:155` →
`https://github.com/blazetrailsdev/trails/blob/main/README.md#zero-declare-models--trails-tsc`,
and the build stays at 0 dead links (44 repointed, 0 stripped).

## Acceptance criteria

- `_media`-copy links that resolve to a wrong-but-existing generated page are repointed
  at their origin-resolved `github.com/.../blob|tree/main/<path>` URL, fragment preserved.
- Non-`_media` (rendered package index) page links are unchanged unless dead.
- `pnpm --filter @blazetrails/website run docs:build` completes with 0 dead links.
- Unit test covers the nested-copy wrong-target case (`../../README.md` from
  `api/_media/twitter-clone`).
