---
title: "Backlog, issues and pulls tabs use the UnderlineNav; retire filter-tabs"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 12
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

trailmap#152 gave /rfcs GitHub's UnderlineNav for its status tabs (partial shared/underline-nav). /backlog (story-pages), repo issues and repo pulls still use shared/filter-tabs ("N label" links). Move them to the same nav so the list pages match, then delete filter-tabs.

When filter-tabs is gone, also drop its regex in scripts/gate-ringo-lists.ts (the `class="tab…"` arm of `counts`). Shots of every page changed. Do it in both apps.
