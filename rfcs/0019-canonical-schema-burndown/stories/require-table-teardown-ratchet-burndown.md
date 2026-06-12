---
title: "Burn down require-table-teardown exclude baseline (18 files)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**Duplicate of `require-table-teardown-burndown` (status: ready).** Both target
the same 18-entry `eslint/require-table-teardown-exclude.json` baseline. To keep
the one-agent-per-work-item model intact, this draft should be **closed as a
duplicate** rather than worked in parallel — two agents converting the same 18
files will collide.

If kept, scope it to a disjoint slice of the 18 files agreed with the owner of
`require-table-teardown-burndown` (non-overlapping files, off `main`, NOT
stacked).

## Acceptance criteria

- [ ] Confirm with the `require-table-teardown-burndown` owner before claiming;
      if that story is active, close this as a duplicate.
- [ ] If proceeding on a disjoint slice: same bar as the sibling — per-table
      teardown or ride `TEST_SCHEMA`, remove files from the exclude JSON, no
      file-level `eslint-disable`.

## Definition of done

Either closed as a duplicate, or its disjoint slice of the 18 files is out of
the exclude JSON with no collisions introduced.
