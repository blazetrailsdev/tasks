---
title: "trailmap: /packages/:name/deviations renders a NULL mark matched as 'null / 0' (twins disagree)"
status: done
updated: 2026-11-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trailmap#126
claim: "2026-11-07T01:47:08Z"
assignee: "deviations-mark-null-matched-renders-null"
blocked-by: null
closed-reason: null
---

## Context

`/packages/:name/deviations` renders the latest value of a matched/total mark as
`${last.matched} / ${last.total}` (trailmap `app/controllers/packages-controller.ts`,
`deviations`, the `marks` map; Rails twin
`rails/app/controllers/packages_controller.rb#deviations`,
`"#{last.matched} / #{last.total}"`). A `package_mark_stats` row with
`value = NULL, matched = NULL, total = 0` renders as `null / 0` in the trails
app and an empty `matched` before "/ 0" in the Rails twin, so the twins disagree. The sparkline also
falls back to `r.value ?? r.matched ?? 0` with no shared rule. Found while
adding a `total = 0` predicates fixture in trailmap#122. The overview's tiles
coalesce `matched` to 0 in both apps.

## Acceptance criteria

- [ ] Both apps render a NULL `matched` as `0` (`0 / 0`) on the deviations page.
- [ ] A test in each app seeds a mark row with NULL `matched` and asserts the
      same markup.
