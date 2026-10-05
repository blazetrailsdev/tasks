---
title: "trailmap: lift the ASCII-only restriction on assets once trails serves static files intact"
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

trailmap#38 made `app/assets/javascripts/dashboard.js`, `app/assets/javascripts/fleet-format.js`
and `app/assets/stylesheets/application.css` pure ASCII, with escapes such as `"—"` and
`"\u{1F4AA}"` in code, as an agreed temporary workaround for the trails bug
`static-files-with-non-ascii-bytes-are-served-corrupted-and-truncated`. This story is the one
CLAUDE.md asks for: it tracks the workaround's end.

Nothing has to be deleted, since the workaround is content. What has to happen is that someone
confirms it is no longer needed and says so where the next author will look, because until then
`scripts/smoke-boot.sh` fails any PR that types an em dash into an asset, and its comment says why.

Note the trails story's own text says "the application has no workaround"; that was true when it
was filed and is not now.

## Acceptance criteria

- [ ] The vendored trails contains the fix for `static-files-with-non-ascii-bytes-are-served-corrupted-and-truncated`.
- [ ] A PR adds a non-ASCII character to an asset and `scripts/smoke-boot.sh` passes, proving the check now tests the framework and not the files.
- [ ] The smoke boot's comment and the escapes in `fleet-format.js` and `dashboard.js` are returned to plain characters, or left with a note that they are no longer required.
