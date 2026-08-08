---
title: "run-sqlite-mem's label description still says non-gating"
status: done
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 1
priority: null
pr: 6192
claim: "2026-08-07T18:48:45Z"
assignee: "strptime-sec-fraction-numerator-is-a-number"
blocked-by: null
closed-reason: null
---

## Context

The GitHub label `run-sqlite-mem` still carries the description
`Run the ARCONN=sqlite3_mem AR suite on this PR (non-gating)`.

That is no longer true. `sqlite-mem-tests` is in the `ci` aggregator's `needs:`
(`.github/workflows/ci.yml`), and the job's own header comment says so
explicitly: "Opting in also gates the merge on it: the job is in the `ci`
aggregator's `needs:`." Story
`0029-sqlite-memory-fidelity/sqlite-mem-lane-merge-gating-decision` (done) made
that call and updated the in-repo docs, but the label description lives in
GitHub repo metadata rather than in the tree, so it was missed and still tells
the opposite story to anyone reading the label picker.

Surfaced while adding the `run-mysql-prepared` label in PR #5533, which copies
the same gating model and whose label description was written accurately
(`... (gates the merge)`). The two now disagree in the label list.

## Acceptance criteria

- `run-sqlite-mem`'s description states that opting in gates the merge, wording
  consistent with `run-mysql-prepared`.
- No code change expected — this is `gh label edit` on repo metadata. If a
  future story moves label definitions into the tree, fold this in there
  instead.
