---
rfc: "draft-your-slug"
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

<!-- Unnumbered until merge: keep `rfc:` as draft-your-slug and the H1 below
     number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

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

| ID                                          | Title          | Status | Est LOC | Cluster        |
| ------------------------------------------- | -------------- | ------ | ------- | -------------- |
| [template-story](stories/template-story.md) | Template story | draft  | null    | cluster-name-1 |

## Changelog

- YYYY-MM-DD: initial RFC
