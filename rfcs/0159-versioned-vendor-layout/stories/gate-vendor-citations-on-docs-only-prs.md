---
title: "Gate vendor citations on docs-only PRs"
status: done
updated: 2026-09-27
rfc: "0159-versioned-vendor-layout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8188
claim: "2026-09-27T16:36:09Z"
assignee: "gate-vendor-citations-on-docs-only-prs"
blocked-by: null
closed-reason: null
---

## Context

`scripts/vendor-citations.test.ts` (trails#8181) runs only in the Unit Tests
job. That job is skipped when `docs_only=true` (`.github/workflows/ci.yml:49-61`,
set at `:239`), so a `.md`-only PR can land an unversioned or stale
`vendor/<source>/…` citation green. The red then surfaces on the next
code-touching PR against an unrelated diff. That is the same failure shape
`ci.yml:124-133` records for stale-story-references (#6980 → #6989).

The gate is cheap (reads `vendor/sources.lock.json` plus `git ls-files`, ~7 s),
so it can run in a job that docs-only PRs do not skip. Another option is to run
`pnpm vendor:recite --check` as a step of whatever lightweight job docs-only
PRs already run.

## Acceptance criteria

- A docs-only PR that adds `vendor/rails/activerecord/lib/...` (no version
  segment) to a tracked `.md` goes red.
- The Unit Tests invocation stays in place (or moves) so code PRs are still
  gated exactly once.
- A/B verified on a docs-only branch.
