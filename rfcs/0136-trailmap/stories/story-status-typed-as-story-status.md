---
title: "Story.status typed as StoryStatus so verbs pass it to from: without a cast"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`app/controllers/story-pages-controller.ts:261` (`backToDraft`, trailmap#212) passes
`from: story.status as StoryStatus` to `Story.statusSetAll`. `Story.status` is the
schema's plain `string` column, while `from:` takes the `StoryStatus` union
(`app/models/story.ts`). `_act` has already checked the stored status against
`storyActions`, so the cast is safe today, but it hides any status the union lacks.
The #212 review accepted the cast and left retyping the column out of scope.

## Acceptance criteria

- `Story#status` reads as `StoryStatus | null` (a typed reader or attribute declaration on the model), and `backToDraft` passes it to `from:` with no `as` cast.
- No other `as StoryStatus` casts remain in `app/`.
- If the narrowing can only be done by reaching past trails' attribute typing, file that as a trails story instead of working around it here.
