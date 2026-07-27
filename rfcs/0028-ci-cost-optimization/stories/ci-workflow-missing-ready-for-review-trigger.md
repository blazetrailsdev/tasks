---
title: "CI workflow never runs on the draft to ready-for-review transition"
status: draft
updated: 2026-07-27
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5428 was opened as a draft at 17:40:33Z and never got a CI run — neither
from the `opened` event nor from the `synchronize` fired by a later push. Every
usual cause was ruled out: `.github/workflows/ci.yml` has no draft guard and no
`paths` filter, the PR targets `main`, a sibling draft (#5450) got a run 3s
after opening, and the repo ran ~50 workflow runs in the surrounding hour. The
event was dropped on GitHub's side. A rebase force-push hours later finally
produced the first run.

The workflow's trigger list is:

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, labeled]
```

`ready_for_review` is absent, so the draft → ready transition — the one moment
an author most expects CI to start — fires nothing. When the `opened` run is
dropped (as here), a PR can sit ready-for-review with zero checks and no event
left that would start one, until the author happens to push again.

## Acceptance criteria

- [ ] Add `ready_for_review` to the `pull_request` `types` list in
      `.github/workflows/ci.yml`.
- [ ] Confirm the added event does not double-run a PR that already has a run
      for the same head SHA (concurrency group is
      `ci-${{ github.workflow }}-${{ github.ref }}` with
      `cancel-in-progress` on pull_request, so a duplicate should cancel the
      older run rather than run twice — verify, don't assume).
- [ ] No change to the existing `opened` / `synchronize` / `reopened` /
      `labeled` behavior.
