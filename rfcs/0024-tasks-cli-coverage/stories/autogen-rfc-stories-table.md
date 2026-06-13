---
title: "Auto-regenerate the Stories table in RFC READMEs from frontmatter"
status: in-progress
updated: 2026-06-13
rfc: "0024-tasks-cli-coverage"
cluster: rfc-commands
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 31
claim: "2026-06-13T20:42:34Z"
assignee: "autogen-rfc-stories-table"
blocked-by: null
---

## Context

Every RFC README carries a hand-maintained `## Stories` table duplicating
story frontmatter (title, status, cluster, est-loc). Nothing reconciles it,
so it drifts the moment a CLI status flip lands — this RFC's own table
already disagrees with its stories' frontmatter (table says `draft`,
frontmatter says `ready`). Worse, fixing the drift by hand is PR-gated
(merged-README edits), so in practice nobody does.

Fix: make the table generated. The pre-commit index build
(`scripts/build-index.mjs`) already parses every story; teach it to rewrite
the region between `## Stories` and the next `##` heading in each RFC README
from frontmatter. Generated-region edits by the hook are exempt from the
README PR gate (same standing as `index.md`).

## Acceptance criteria

- [ ] `build-index.mjs` (or a sibling invoked by the same hook) regenerates
      each RFC README's `## Stories` table from story frontmatter: ID
      (linked), title, status, est-loc, cluster — sorted stably (e.g. by
      status then ID) so reruns are idempotent.
- [ ] READMEs without a `## Stories` heading are left untouched; a marker
      comment (e.g. `<!-- generated: stories table -->`) is inserted so
      future readers know not to hand-edit.
- [ ] All existing RFC READMEs are regenerated once in this PR, eliminating
      current drift; `validate.mjs` (or the hook) fails if the table is
      stale.
- [ ] The 0000-template README documents that the table is auto-generated.

## Notes

Run order matters: regenerate tables **before** prettier in the pre-commit
chain so formatting is applied to the generated output. Keep the table
columns identical to today's so existing READMEs diff minimally.
