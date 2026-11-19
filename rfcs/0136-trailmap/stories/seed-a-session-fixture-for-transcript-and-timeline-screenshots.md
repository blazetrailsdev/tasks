---
title: "Seed a session fixture so the transcript and PR-timeline pages can be shot without a ringo origin"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 14
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

`lay-out-the-remaining-pages-to-the-github-style-guide` needs light, dark and 390px screenshots of every page it restyles. The session transcript (`app/views/sessions/transcript.html.tse`) and the PR timeline (`app/views/sessions/_timeline.html.tse`) can only be reached through ringo's session archive. On a box with no ringo origin, `/sessions` renders just its "No session data — no ringo origin is configured" notice (trailmap#161), so neither page can be shot. trailmap#161 restyled both and shipped without pictures of either.

## Acceptance criteria

- A documented local way (a fixture archive, or a stub ringo origin) to boot trailmap so `/sessions`, a session's PR timeline and a transcript render real-looking content.
- README's screenshot instructions say how to use it.
- The same works for the Rails twin.
