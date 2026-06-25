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

## Non-goals

Deliberately descoped work, each with a one-line reason. This is where an
RFC-level descoping decision lives canonically — don't leave it only in
session memory or a story comment.

- **Name:** what it is, why it's out of scope.

## Alternatives considered

- **Name:** what it is, why it was not chosen.

## Rollout

Ordered phases, referencing story IDs for each phase.

1. Phase 1 — story IDs
2. Phase 2 — story IDs

## Verification

How we'll know the RFC worked — a concrete metric, count, or burndown target
(e.g. "exclude list reaches zero entries", "test:compare delta ≥ +40"). State
the number, not a vibe.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **Question.** Options and recommendation.

## Changelog

- YYYY-MM-DD: initial RFC
