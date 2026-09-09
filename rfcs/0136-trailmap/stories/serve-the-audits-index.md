---
title: "Serve /audits and the audit viewer, with ringo's filename validation"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo serves `/audits` and `/audits/view/<file>` from `webhook/audits.go`. The
tab lists agent-written progress reports — process audits (`.md` or
self-contained `.html`) and grade report cards — newest first, straight off a
directory. `auditFileRe` is the only filename shape the view handler will
serve: no separators, no dotfiles.

This is deliberately at the edge of RFC 0136's scope. The audits are
file-backed, not `tasks.db`-backed, and the RFC's non-goals keep `stats.db`
Go-owned. It is included in phase B anyway because the tab is part of the
dashboard a person actually opens, and because serving a directory of
user-supplied files is exactly the unglamorous framework surface the proving
ground is for.

## Acceptance criteria

- `/audits` lists the same files in the same order as ringo's page.
- `/audits/view/<file>` serves one file, with the SAME filename validation
  ringo enforces — port `auditFileRe`'s constraints, do not relax them.
- A test proves a path-traversal attempt and a dotfile are both refused.
- Read-only: the "Generate report card" trigger stays on ringo.
- Grades (`/grades`, `/grades/view/`) are NOT in scope — they read `stats.db`,
  which RFC 0136 leaves Go-owned.
