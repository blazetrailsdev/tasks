---
title: "Reconcile + delete gaps/type-audit/adapter-cleanup docs"
status: in-progress
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Three AR docs already have a home RFC but were never closed out:
`activerecord-gaps.md` → RFC 0005, `activerecord-type-audit.md` → RFC 0009,
`adapter-architecture-cleanup.md` → RFC 0010 + RFC 0007. Verify each doc's
content is fully represented in its RFC (folding any missing actionable item in
as a story), then queue the docs for deletion. See RFC 0011 §Phase 2.

## Acceptance criteria

- [ ] Every still-open item in `activerecord-gaps.md` is represented in RFC 0005
      (as a story or §Deferred entry); gaps folded in.
- [ ] Same coverage check for `activerecord-type-audit.md` vs RFC 0009.
- [ ] Same for `adapter-architecture-cleanup.md` vs RFC 0010 + RFC 0007.
- [ ] Discrepancies resolved by editing the target RFC, not the doc.
- [ ] The three docs queued for deletion in `decommission-docs`.

## Notes

These three are "reconcile + delete" in the disposition table — no new RFC,
just close the coverage gap against the existing ones.
