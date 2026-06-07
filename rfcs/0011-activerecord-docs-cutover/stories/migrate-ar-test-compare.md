---
title: "RFC from workplan + attack-plan + 100-plan + index"
status: done
updated: 2026-06-07
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 300
pr: 10
claim: "2026-06-07T19:07:51Z"
assignee: "migrate-ar-test-compare"
blocked-by: null
---

## Context

The four high-traffic AR test-compare drivers — `workplan.md` (per-story spec
source), `test-compare-100-attack-plan.md` (authoritative ordering + skip
inventory), `activerecord-100-plan.md` (batch list + per-file backlog), and
`activerecord-index.md` (phase sequencing) — become one RFC. See RFC 0011
§Phase 2. Reconcile (`reconcile-existing-rfcs`) must land first so the import
baseline is clean.

## Acceptance criteria

- [ ] New RFC (e.g. `draft-ar-test-compare-100`) authored via the placeholder →
      PR flow.
- [ ] Open, actionable items → dep-aware stories (carry `file:line` anchors and
      Rails refs from `workplan.md`).
- [ ] Ordering/sequencing prose and the skip inventory live in the RFC body;
      deferred / permanent-skip items in §Deferred (not stories).
- [ ] No item silently dropped vs. the four source docs — cross-check coverage.
- [ ] The four source docs are queued for deletion in `decommission-docs`
      (NOT deleted in this story).

## Notes

`workplan.md` warns Waves 4–7 anchors are doc-sourced and drift — re-grep
before trusting any cited line.
