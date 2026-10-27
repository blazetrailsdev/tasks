---
title: "Show the archive-mode and unclaimed-pane-capture notes on /sessions"
status: draft
updated: 2026-10-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo's `/sessions` index (`serveList`, btwebooks `webhook/sessionarchive_page.go`) shows two notes that trailmap#81 did not port, because `/api/sessions` carries neither:

- The archive mode note (`st.Status()` / `st.Mode()`), for example when pane logs are off.
- The unclaimed pane captures note (`st.UnclaimedPaneLogs()`): a count and size of panes that were armed at spawn but ended before they were linked to a PR.

## Acceptance criteria

- ringo serves both values (for example on `/api/sessions/status`), and `SessionArchive` reads them.
- trailmap's `/sessions` renders both notes with ringo's wording, and only when they apply.
- Controller tests cover each note shown and hidden.
