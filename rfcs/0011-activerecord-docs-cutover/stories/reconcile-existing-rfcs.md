---
title: "Reconcile + close RFCs 0001–0010"
status: ready
rfc: "0011-activerecord-docs-cutover"
cluster: reconcile
deps: ["reconcile-tooling"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Run the reconcile report and apply it: make every story in 0001–0010 reflect
reality, and close RFCs whose work is all shipped. Automated first, then manual
for the residue. See RFC 0011 §Phase 1.

## Acceptance criteria

- [ ] `reconcile.mjs` run across all of 0001–0010; report archived in the PR.
- [ ] Every `likely-done` story flipped to `status: done` with its `pr:`,
      after a manual spot-check of the evidence.
- [ ] Every `blocked` story's blocker re-verified to still exist; unblocked
      ones flipped to `ready`.
- [ ] Every `unknown` story manually triaged to `done` / `ready` / `blocked`.
- [ ] Any RFC whose stories are all `done` set to `status: closed`.
- [ ] Status flips committed direct-to-main (no PR gate on story status).

## Notes

This is the validation pass that makes `tasks ready` trustworthy again. Lean on
the memory index for the AR features known to have shipped.
</content>
