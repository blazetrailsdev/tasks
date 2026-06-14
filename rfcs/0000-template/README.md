---
rfc: "0000-your-slug"
title: "Short prose title"
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: "@your-handle"
packages: []
clusters:
  - cluster-name-1
  - cluster-name-2
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Title

## Summary

One paragraph. What is this? Why does it matter?

## Motivation

What is the current state? What pain does it cause? Include concrete
evidence (error messages, grep counts, CI failure rates).

## Design

The full design. Subsections as needed.

## Alternatives considered

- **Name:** what it is, why it was not chosen.

## Rollout

Ordered phases, referencing story IDs for each phase.

1. Phase 1 — story IDs
2. Phase 2 — story IDs

## Open questions

1. **Question.** Options and recommendation.

## Stories

The table below is auto-generated from story frontmatter on commit — edit story
files, not this table. Prose in this section is preserved: only the marker and
the table rows are regenerated, so any note this section needs (how to read
`Est LOC`, phase/sequencing notes) can sit above or below the table and will
survive every commit.

<!-- generated: stories table -->

<!-- This table is AUTO-GENERATED from story frontmatter by
     scripts/stories-table.mjs (run by the pre-commit hook). Do NOT hand-edit
     it — edits are overwritten on commit, and `pnpm validate` fails on drift.
     Only this marker and the table rows below are regenerated; prose elsewhere
     in the `## Stories` section is preserved. Change a story's
     title/status/est-loc/cluster in its frontmatter instead. (This
     0000-template README is itself exempt from regeneration.) -->

| ID                                          | Title          | Status | Est LOC | Cluster        |
| ------------------------------------------- | -------------- | ------ | ------- | -------------- |
| [template-story](stories/template-story.md) | Template story | draft  | null    | cluster-name-1 |

## Changelog

- YYYY-MM-DD: initial RFC
