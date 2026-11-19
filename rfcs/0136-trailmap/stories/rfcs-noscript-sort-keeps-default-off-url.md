---
title: "/rfcs no-JS sort submit puts sort=priority on the URL"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 10
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

On /rfcs, the sort menu's `<noscript>` submit sends `?status=…&sort=priority`. That puts the default sort on the URL; with JavaScript, rfc-sort.js keeps it off. This was review finding 4 on trailmap#152. Pick one fix: have the controller redirect `sort=priority` to the bare URL (both apps), or accept it and say so in the view's comment.

Acceptance: a no-JS submit of the default sort lands on `/rfcs?status=<s>`, or the decision is documented. Tests on both sides.
