---
title: "Confirm ringo's transcript page escapes its fields and works under trailmap's CSP sandbox"
status: draft
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

trailmap#82 serves ringo's `/sessions/transcript` page on trailmap's origin with `Content-Security-Policy: sandbox` (`app/controllers/sessions-controller.ts`, `transcript`), because nobody could confirm that ringo's transcript renderer escapes every field (tool output, user text). A bare `sandbox` also stops every script on the page.

- Read ringo's `HandleTranscript` and its template, and confirm each field goes through `html/template` escaping.
- Load a real transcript through trailmap and check it still works (collapsing, links, anything that needs JS). If it needs scripts, relax the header to `sandbox allow-scripts`, which still gives the page a unique origin.

## Acceptance

- Either the header stays and a real transcript is shown to work under it, or it changes and the test in `test/controllers/sessions-files.test.ts` changes with it.
