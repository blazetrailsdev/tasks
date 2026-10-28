---
title: "trailmap: /stories/:id, /stories/touching and /up/deep still build every story record"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trailmap#89
claim: "2026-10-28T13:08:18Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

trailmap#66 moved `/stories/ready.json`, `/stories/next-bundle.json`,
`/stories.json` and `/index.json` off `Story.rankingIndex()`. Three callers
still build every `Story` record (12,700 of them) per request:

- `StoriesController#show` (`app/controllers/stories-controller.ts`) — to
  return one story.
- `StoriesController#touching` — `storiesTouchingIn` reads `story_paths` and
  status only.
- `ProbesController#deep` (`app/controllers/probes-controller.ts`).

Also left by #66: `Story.rankingRows()` returns plain rows typed
`as unknown as Story`. The tests run the filter and the serializer over rows,
but the type still lets a record method be called on one.

## Acceptance criteria

- [ ] `show` and `touching` answer byte-identically without building a record they do not return.
- [ ] `rankingRows` returns a row type (the serialized columns), and `serializeStory` / `listFilteredIn` accept it without a cast.
