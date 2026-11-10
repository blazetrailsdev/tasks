---
title: "trailmap: link every story in a session's bundle"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionpack, activerecord]
deps: [fleet-session-list]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Bundled PRs close several stories. The tasks database trailmap opens
(`config/database.ts:37-54`) has `Story.pr` as `repo#N`
(`app/models/story.ts:61-63`). The fleet envelope carries no stories, and
ringo's envelope is out of scope for this RFC. The reviewer list is already
fetched beside the stream (`fleet/reviewers`, `FleetController#reviewers`,
`app/controllers/fleet-controller.ts:180`).

## Acceptance criteria

- [ ] A `fleet/stories` read returns, for each `repo#N` it is asked about,
      the stories whose `pr` is that ref, with id, title, status and RFC. It
      reads trailmap's own tasks database, never ringo, and is fetched on the
      reviewer poll's cadence (`pollReviewers`,
      `app/assets/javascripts/dashboard.js:308`).
- [ ] A session card lists the lead story as its title and the rest as links
      to the story pages, with no separate "bundle · N" tag.
- [ ] A PR with no matching story shows the PR title, as today.
- [ ] A controller test covers a PR with zero, one and several stories.

## Verification

- `pnpm vitest run test/controllers/fleet-controller.test.ts` and
  `pnpm vitest run test/assets/fleet-format.test.js`.

## Notes

This is an interim browser fetch. RFC 0136's
`render-the-reviewer-line-on-the-dashboard` replaces the reviewer fetch with
models, and this read moves into the server render at the same time. Note it
in that story's Context when this lands.
