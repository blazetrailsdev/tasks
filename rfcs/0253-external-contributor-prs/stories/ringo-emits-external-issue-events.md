---
title: "ringo: record external issues and emit external_issue.* events"
status: ready
updated: 2026-11-20
rfc: "0253-external-contributor-prs"
cluster: trust-gate
packages: []
deps: [ringo-classify-pr-trust-closed-by-default]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo has no `issues` handler at `9c89ab4`, so an issue reaches nothing.
The inbox needs external issues, and nothing may act on them by itself.

## Acceptance criteria

- The tracked repos' webhook subscription (or the 0200 relay) includes
  `issues`. The PR records which one.
- External `issues` (`opened`, `edited`, `closed`, `reopened`) and
  `issue_comment` events on issues emit `external_issue.<action>` with
  `{repo, issue, author, action}`. `GET /api/external-issues` lists open
  ones.
- A test asserts zero `gh` writes, zero story writes and zero pane spawns
  for an external issue.
