---
title: "Mount ringo's audits directory and set AUDITS_DIR on the deployed app"
status: draft
updated: 2026-10-21
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

## Finding (surfaced by trailmap#73)

`/audits` reads `AUDITS_DIR` (config/application.ts → `config.x.audits.dir`).
docs/deploy.md documents the read-only mount and the config line, but the
deployed app has neither, so production `/audits` says "no AUDITS_DIR" and
lists nothing.

## Do

```sh
dokku storage:mount trailmap \
  /home/dean/.btwhooks/data/github/blazetrailsdev/trails/audits:/audits:ro
dokku config:set trailmap AUDITS_DIR=/audits
```

Then verify that the deployed `/audits` lists the same files as ringo's
`/spawnloop/audits` (kind `audit`).
