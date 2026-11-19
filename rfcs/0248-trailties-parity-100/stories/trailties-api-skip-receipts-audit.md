---
title: "trailties: audit the 20 global and 19 scoped API skips"
status: in-progress
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10373
claim: "2026-11-19T18:33:07Z"
assignee: "port-source-paths-for-not-namespaced-generators-test"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` reports `global skip 20 | scoped skip 19` for trailties Ruby defs.
Each skip must carry a reason that starts with `PERMANENT:` and names a ratified
CLAUDE.md section, or be removed so the member is scored.

## Acceptance criteria

- [ ] Every trailties-scoped skip reason starts with `PERMANENT:` and cites a section.
- [ ] Any member un-skipped is matched or filed as its own story.
