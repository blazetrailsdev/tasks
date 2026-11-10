---
title: "trailmap: link every story in a session's bundle"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: []
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

- [ ] An endpoint (or the reviewers response) returns, for each open PR in
      the envelope, the stories whose `pr` is that PR, with id, status and
      RFC.
- [ ] A session card lists the lead story as its title and the rest as links
      to the story pages, with no separate "bundle · N" tag.
- [ ] A PR with no matching story shows the PR title, as today.
- [ ] A controller test covers a PR with zero, one and several stories.
