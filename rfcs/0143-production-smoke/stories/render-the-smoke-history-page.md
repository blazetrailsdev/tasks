---
title: "Render the smoke history page"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["record-smoke-runs-in-a-table"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The rows are the evidence; the page is what makes the soak sign-off a reading
rather than a claim. It also bounds every incident by the release it appeared
in, because each row carries the image id.

This is a page trails has to render from models, which is the point — it is
ordinary application surface built on the port, and gaps it hits are framework
stories.

## Acceptance criteria

- [ ] A page lists recent runs grouped by tier, with each assertion's current
      state and its last transition
- [ ] A failing assertion shows when it started failing and the release it
      started failing on
- [ ] The page answers "was everything green between two dates" directly
- [ ] It renders with an empty table rather than erroring
- [ ] Any framework gap hit while building it is filed as a trails story and
      linked here

## Verification

The page reproduces, by eye, the same answer a hand-written `SELECT` gives for
a chosen week.
