---
title: "Audit autosave save/destroy call-set omissions"
status: draft
updated: 2026-06-23
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: real-omission
deps: ["call-mismatches-ratcheting-baseline"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Four flagged pairs in the autosave path:
`packages/activerecord/src/autosave-association.ts`
`save_collection_association`, `save_has_one_association`,
`save_belongs_to_association` (each missing `save`/`destroy`), and
`packages/activerecord/src/associations/has-one-association.ts` `replace`
(missing `save`). Rails' autosave_association.rb saves/destroys associated
records inside these methods; if the TS bodies route saving through a
different helper the flag may be a false positive, but a genuinely missing
save/destroy would silently drop autosave persistence.

## Acceptance criteria

- For each of the 4 methods: compare Rails autosave_association.rb /
  has_one_association.rb against the TS body.
- Real omissions converge (associated records saved/destroyed) with a test
  exercising autosave (match Rails test names).
- Confirmed equivalents (save/destroy reached via a different call) get a
  justified baseline entry.
- All 4 entries resolved in `call-mismatches.json`.
