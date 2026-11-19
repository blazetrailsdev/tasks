---
title: "Document RINGO_BASE in README's Running it"
status: ready
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

README.md "Running it" lists TASKS_DATABASE, TASKS_DIR and HUB_DATABASE_URL, but not `RINGO_BASE`
(`Setting.ringoBase()`, app/models/setting.ts). Without it, `/dashboard` boots and every fleet
request — `/fleet/socket`, `/fleet/reviewers` — answers 503 "no ringo origin is configured", so the
page shows no sessions. Found while shooting screenshots for trailmap#166; production has
`RINGO_BASE=http://btwhooks.web:8080`, which from the host is the btwhooks.web.1 container's bridge IP.

## Acceptance criteria

- "Running it" exports `RINGO_BASE`, with how to get the host-reachable address.
- Note that `/dashboard` (not `/`) is the fleet page.
