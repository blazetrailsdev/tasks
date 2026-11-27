---
title: "preview.sh prBody does not overwrite a concurrent PR body edit"
status: done
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trailmap#205
claim: "2026-11-26T23:14:37Z"
assignee: "bump-the-ringo-pin-for-rfc-session-endpoints"
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#160. `prBody` in `scripts/preview.sh` reads the PR body, edits it and writes it back with `gh pr edit`, so an edit someone makes to the body during a deploy is silently overwritten. Expected: re-read the body right before writing and skip the write (with a warning) if it changed, or document the race in docs/deploy.md.

Also delete the trailing-blank-line `sed` in the same function: `$(…)` already strips trailing newlines, so it does nothing.
