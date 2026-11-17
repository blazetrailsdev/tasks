---
title: "ringo's /api/sessions honours ?owner=&repo=&pr= so fleet/transcript fetches one PR's archives"
status: ready
updated: 2026-11-17
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

Since trailmap#142, `SessionArchive.forPr` (`app/models/session-archive.ts`, `listed`/`forPr`) and Rails' `for_pr` (`rails/app/models/session_archive.rb`) ask `GET $RINGO_BASE/api/sessions?owner=&repo=&pr=`, in that key order. They keep an in-memory filter as a fallback. Live ringo still ignores the query: on 2026-11-15, both `/api/sessions` and `/api/sessions?owner=blazetrailsdev&repo=trailmap&pr=141` returned 4,812,255 bytes. Every `fleet/transcript` poll therefore still downloads every archive. ringo's Go side already has `ForPR` (`webhook/sessionarchive_page.go`). The handler just doesn't route the query to it.

The expected shape: when `owner`, `repo` and `pr` are all present, `/api/sessions` returns `ForPR(owner, repo, pr)` in `List` order. Without them it returns the whole list, as today.

## Acceptance criteria

- `curl "$RINGO_BASE/api/sessions?owner=blazetrailsdev&repo=trails&pr=<N>"` returns only that PR's archives.
- A Go test in ringo covers the filtered and unfiltered answers.
- Bump the vendored ringo pin in trailmap if the snapshot gates read this endpoint.
