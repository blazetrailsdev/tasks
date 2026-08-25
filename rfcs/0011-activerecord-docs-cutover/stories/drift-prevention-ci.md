---
title: "CI gate: no new docs/activerecord trackers + CLAUDE edit"
status: done
updated: 2026-06-13
rfc: "0011-activerecord-docs-cutover"
cluster: guardrails
deps: ["repoint-references"]
deps-rfc: []
est-loc: 100
priority: 26
pr: 3208
claim: "2026-06-13T21:00:34Z"
assignee: "drift-prevention-ci"
blocked-by: null
---

## Context

The cutover only holds if `docs/activerecord/` can't grow a new tracker.
Without a guardrail the two-source-of-truth split self-heals. Lands in the
**trails** repo. See RFC 0011 §Phase 4.

## Acceptance criteria

- [ ] CI check that fails on any added/modified file under
      `docs/activerecord/`, with a one-entry allowlist:
      `docs/activerecord/parity-verification.md`.
- [ ] The check runs on PRs touching that path and gives an actionable message
      ("AR work tracking lives in the tasks repo — add a story, not a doc").
- [ ] `CLAUDE.md` working-principles updated: AR work tracking lives in `tasks`;
      pick via `pnpm tasks`, never by hand-editing an `activerecord` plan doc.
- [ ] Non-AR docs explicitly NOT policed (they remain live until their own
      cutover).

## Notes

Implement as a small CI step (path filter + allowlist), not a heavyweight tool.
