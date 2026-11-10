---
title: "trailmap: link every story in a session's bundle"
status: draft
updated: 2026-11-10
rfc: "0000-trailmap-fleet-session-redesign"
cluster: fleet-sessions
packages: [actionpack, activerecord]
deps: [fleet-session-card]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The tasks database trailmap opens (`config/database.ts:37-54`) has
`Story.pr` as `repo#N` (`app/models/story.ts:61-63`). The RFC's "Bundle
stories" specifies the request, the answer, the lead-story rule and late
attribution.

## Acceptance criteria

- [ ] `GET fleet/stories?pr=<ref>&pr=…` answers
      `{ "<ref>": [{ id, title, status, rfc }] }` for at most 100 refs, with
      stories of every status. More than 100 refs is a 400.
- [ ] The page sends one request per reviewer poll (`pollReviewers`,
      `app/assets/javascripts/dashboard.js:308`) for every PR in the current
      envelope.
- [ ] The card titles itself with the lead story (branch minus the
      `-<4 hex>` spawn suffix, else the first by id) and lists the rest as
      links to the story pages.
- [ ] A PR with no stories yet shows its PR title, and picks up its stories
      on the next poll.

## Verification

- `pnpm vitest run test/controllers/fleet-controller.test.ts` for zero, one
  and several stories, a done story, and the 100-ref limit; and `pnpm vitest run test/assets/fleet-format.test.js` for
  the lead rule.

## Notes

This read moves into the server render with RFC 0136's
`render-the-reviewer-line-on-the-dashboard`. Note it in that story's Context
when this lands.
