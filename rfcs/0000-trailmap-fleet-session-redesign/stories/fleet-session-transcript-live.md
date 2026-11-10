---
title: "trailmap: live transcript steps in a running session's log"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-session-detail
packages: [actionpack]
deps: [fleet-session-transcript-archived]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fleet-session-transcript-archived` reads complete archives. A running
session's archive may not exist until it ends. That is the RFC's open question
2, and this story stays `draft` until it is answered.

## Acceptance criteria

- [ ] Open question 2 is answered in the RFC. If ringo must write the
      archive during the session, that change is filed in ringo, with its
      link added to this story's `deps-rfc` or Notes, before this story is
      promoted.
- [ ] A live session's expanded log shows its steps through
      `fleet/transcript`, refreshed while expanded, at most once per 10
      seconds.

## Verification

- `pnpm vitest run test/controllers/sessions-controller.test.ts` with a
  fixture of a growing archive.
