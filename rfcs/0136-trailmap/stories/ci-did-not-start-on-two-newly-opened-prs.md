---
title: "trailmap: CI did not start on two newly opened PRs until they were reopened"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On 2026-10-05, trailmap#34 and trailmap#35 were opened as drafts with `gh pr create` and no CI run
started: `gh pr checks` reported "no checks reported" twenty minutes later and `gh run list` showed
nothing for the branch. Closing and reopening each PR started CI at once. trailmap#36, opened the
same way an hour later, started on its own, as every PR before the 5th had. GitHub's status page
showed no incident.

`.github/workflows/ci.yml` triggers on `pull_request` with the default activity types. Not
diagnosed. A PR with no checks is indistinguishable from one whose checks have not started, and the
review flow waits on a "CI is green" signal that then never comes.

## Acceptance criteria

- [ ] The cause is identified, or the two PRs are shown to be a GitHub-side blip with the run history as evidence.
- [ ] If it can recur: something notices a PR that has had no run for ten minutes and says so.
