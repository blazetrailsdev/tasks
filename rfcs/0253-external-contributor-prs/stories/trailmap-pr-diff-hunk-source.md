---
title: "trailmap: read a PR's diff hunks at its head for review-draft comments"
status: draft
updated: 2026-11-21
rfc: "0253-external-contributor-prs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story `trailmap-review-draft-editor` puts each drafted review comment's
textarea "next to its diff hunk". trailmap has no source for PR diffs:
`app/controllers/repo-pulls-controller.ts` only links out to GitHub, and
`app/models/pull-request.ts` is the stats cron's merged-PR row. ringo's draft
comment carries only `path`, `line` and `side`
(btwebooks `webhook/externalreview.go:36-41`).

## Acceptance criteria

- trailmap can read a PR's files and patches at a given head SHA, with a read
  token only. That is either a ringo read (`GET /api/pr-diff?repo=&pr=`, added
  to `FLEET_READS` in `config/fleet.ts`) or a GitHub read in trailmap. The
  rails/ app does the same.
- A helper cuts the hunk that contains a `(path, line, side)` out of a patch.
  It is tested against a multi-hunk patch, a deleted-side line, and a line
  outside every hunk.
- The PR's head SHA is exposed with the diff, so a stored draft can be marked
  stale against it.
