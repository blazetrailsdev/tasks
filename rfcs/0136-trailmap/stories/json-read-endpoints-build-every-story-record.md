---
title: "trailmap: the JSON read endpoints still build every story record"
status: draft
updated: 2026-10-04
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The half of `backlog-and-stories-json-load-every-story-record` that trailmap#33 did not do.
After trailmap#33 (production mode, 177 RFCs, 11,531 stories, three requests each):

- `/stories/ready.json`: 1.25-1.59 s for 92 KB. It returns about 130 stories and builds all 11,531.
- `/stories/next-bundle.json`: the same shape, a handful of stories out.
- `/stories.json`: 1.47-1.49 s, 8 MB. Serializes every story.
- `/index.json`: 2.7-3.4 s, 8 MB. Serializes every story.

The first two can do what `/backlog` now does: rank on `Story.rankingOutline()` in
`app/models/story.ts` and load records for the stories they return. The obstacle is
`app/serializers/story-json.ts`, whose context is a `RankingIndex` of records. The last two need
every record and wait on trails (`record-instantiation-costs-ninety-microseconds-a-row`) unless they
serialize from plucked rows.

## Acceptance criteria

- [ ] `/stories/ready.json` and `/stories/next-bundle.json` answer in under 300 ms, byte-identical, and build records only for the stories they return.
- [ ] `/stories.json` and `/index.json` answer in under 500 ms, or this story records what in trails they are waiting for.
