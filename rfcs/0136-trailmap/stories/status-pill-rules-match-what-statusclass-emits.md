---
title: "Status pill rules match what statusClass emits: refining and sunsetting are styled, dead ones go"
status: done
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#150
claim: "2026-11-17T01:06:47Z"
assignee: "dashboard-e2e-covers-message-mode-footer"
blocked-by: null
closed-reason: null
---

## Context

`statusClass` (`app/assets/javascripts/fleet-format.js:34`) builds
`status status-<words>` and is now only called with "limit reached",
"waiting for answer", "sunsetting" and "refining" (`fleet-format.js:786-796`).
The stylesheet has rules for statuses nothing emits any more and none for two
that are: `app/assets/stylesheets/application.css:993-996` style
`.status-waiting-for-ci`, `.status-ready-to-merge`, `.status-spawned`,
`.status-waiting-for-fixes`, `.status-waiting-for-pr` and
`.status-waiting-for-review`, while `.status-sunsetting`, `.status-refining`
and `.status-limit-reached` have no rule, so a grooming agent's "refining" /
"sunsetting" draws as bare text beside its title (visible in trailmap#145's
dashboard screenshots).

## Acceptance criteria

- Every class `statusClass` can produce has a rule, drawn as the style guide's
  Label (`.Label` / `.flag`), and no `.status-*` rule exists for a status
  nothing emits.
- A test lists the statuses `statusClass` is called with and asserts each has a
  rule in the stylesheet.
