---
title: "audit-report skill: POST the report to trailmap instead of writing a file"
status: draft
updated: 2026-11-17
rfc: "0000-trailmap-audits-refinements-activestorage"
cluster: writers
packages: []
deps: [audits-create-endpoint-on-the-loopback-api]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

**Lands in:** trails (`.claude/skills/audit-report/`).

## Context

`.claude/skills/audit-report/run.sh:44-52` writes
`/home/dean/.btwhooks/data/github/${OWNER}/${REPO}/audits/${SLUG}-${TIMESTAMP}.md`
and prints the path. `SKILL.md` tells the parent session to read that path
back. After `audits-create-endpoint-on-the-loopback-api` lands, trailmap is
the store.

## Acceptance criteria

- [ ] `run.sh` keeps its input parsing and slug check (`:11-38`). It builds the
      JSON with `jq` (`slug`, `repo` = `owner/repo`, `body`), POSTs to
      `${TRAILMAP_API:-http://127.0.0.1:8080}/audits`, and prints the
      returned URL.
- [ ] Any status but 200/201 exits non-zero with the response body, and no
      file is written (RFC Open question 3).
- [ ] `SKILL.md` says to read a report with
      `curl -s http://127.0.0.1:8080/audits/<id>/raw`. The `~/.btwhooks` path
      is gone from both files.
