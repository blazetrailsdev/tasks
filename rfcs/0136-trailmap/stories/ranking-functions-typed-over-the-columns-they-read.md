---
title: "trailmap: ranking functions take Story where they read six columns, so plucked rows are cast as unknown as Story"
status: done
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#75
claim: "2026-10-22T16:55:43Z"
assignee: "bump-the-ringo-pin-to-carry-the-write-path-and-smoke-cards"
blocked-by: null
closed-reason: null
---

## Context

`nextBundleIn`, `bundleScope` and `bestBundle` (`app/models/concerns/ranking.ts`) take `RankingIndex<Story>`. They read only `id`, `rfc_id`, `status`, `priority`, `est_loc` and `cluster`. Because of that type, `Story.bundleOutline` and `Story.rankingRows` (`app/models/story.ts`) build plain plucked rows and cast them `as unknown as Story`. The type then claims those rows are records. trailmap#74 had to defend against exactly that: a scoped index served four-column rows as records.

## Acceptance criteria

- The ranking functions are typed over a `RankedStory`-style interface that names the six columns they read, and `claimableIn` is generic over it as it already is.
- `bundleOutline` builds that type with no cast, and nothing that returns `Story` can hold a plucked row.
- `pnpm gate` stays byte-identical.
