---
title: "attached-one-types-delegated-attachment-members"
status: in-progress
updated: 2026-11-22
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10580
claim: "2026-11-22T16:54:09Z"
assignee: "attached-one-types-delegated-attachment-members"
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Attached::One` ends with `delegate_missing_to :attachment, allow_nil: true`
(`vendor/rails/v8.0.5.2/activestorage/lib/active_storage/attached/one.rb:27`), so
`post.cover_image.variant(resize_to_limit: [800, 400])` reaches `Attachment#variant`. trails'
`One` (`packages/activestorage/lib/attached/one.ts`) does not expose the delegated `Attachment`
members in its type, so `post.coverImage.variant(...)` in
`examples/homepage/app/views/posts/show.html.tse` reports TS2339 (`Property 'variant' does not exist on type 'One'`).

## Acceptance criteria

- `One`'s type answers the `Attachment` members `delegate_missing_to` forwards (at least `variant`,
  `url`, `blob`), typed from `Attachment`.
- The homepage view compiles without the TS2339 at (4,32); drop that row from the expected list in
  `packages/website/src/lib/landing-samples.test.ts`.
