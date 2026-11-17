---
title: "trailmap: carry LOC, findings total and check counts so the session figure can show them"
status: ready
updated: 2026-11-17
rfc: "0232-trailmap-fleet-session-redesign"
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

RFC 0232's "The session list" gives each row one progress figure: LOC against the ceiling while drafting and in self review, findings converged (`openFindings` against the review's total) at Reviewer convergence, and checks passed while getting CI green. It also asks for an "N check failed" flag.
The ringo envelope (`PRState`, `webhook/tracker.go:22`) carries none of LOC, a findings total, or check counts. So `stageFigure` in trailmap's `app/assets/javascripts/fleet-format.js` (trailmap#140) shows only open findings or review cycles and the CI rollup. It shows nothing at Drafting or Self review, and the flag reads "check failed" with no count.

## Acceptance criteria

- [ ] The envelope carries the PR's additions plus deletions (and the LOC ceiling), the review's total findings, and passed, failed and total check counts.
- [ ] `stageFigure` shows LOC/ceiling at Drafting and Self review, converged/total findings at Reviewer convergence, and passed/total checks at Getting CI green, with tests.
- [ ] The failed-check flag reads "N check failed".
