---
title: "Gate rails-comparison and lint on relevant changes instead of every non-docs PR"
status: draft
updated: 2026-06-14
rfc: "0000-ci-cost-optimization"
cluster: change-gating
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`rails-comparison` (avg **2.86 billed min** — Ruby setup + `pnpm build` +
vendored-source fetch + 9 compare steps) and `lint` (1.29 min) both gate only on
`needs.changes.outputs.docs_only != 'true'`. That means a PR that touches only,
say, `scripts/tasks/`, the website, or repo tooling still pays for a full Rails
API/test comparison and a full workspace lint, even though nothing those jobs
check actually changed.

`rails-comparison` is only meaningful when package source under `packages/**`
or the compare tooling (`scripts/api-compare/`, `scripts/test-compare/`,
`scripts/fixtures-compare/`, `vendor/`) changed. The `changes` job already
computes per-package affected flags and an infra regex; this story adds a gate
output for "any comparison-relevant path changed" and points `rails-comparison`
at it.

## Acceptance criteria

- [ ] Add a `changes` output (e.g. `comparison_affected`) that is true when any
      `packages/**` source, `scripts/{api,test,fixtures}-compare/**`,
      `vendor/**`, or cross-cutting infra path changed (reuse the existing
      `INFRA_RE` + per-package logic; force-true on push/schedule/dispatch as
      the other gates do).
- [ ] `rails-comparison` adds a `comparison_affected == 'true'` clause to its
      `if:` (alongside the existing `docs_only != 'true'` check).
- [ ] Update the aggregate `ci` job's skip-allowlist to accept a legitimate
      `rails-comparison` skip when `comparison_affected == 'false'`.
- [ ] (Optional, same PR if it fits) gate `lint` similarly so a docs/tooling
      change that touches no lintable source can skip it — only if a clean gate
      exists; otherwise leave `lint` as-is and note why.
- [ ] CI green on: a `packages/**` PR (job runs), a `scripts/tasks/`-only PR
      (job skips), and a push to `main` (job runs).

## Savings & risk

- **Est. savings:** ~2–3 billed job-min on the subset of PRs that touch no
  package source (tasks-CLI, tooling, website-only). Lower frequency than the
  AR-affecting majority, but cheap and pure-win on those PRs.
- **Risk:** low–medium. The hazard is **under-gating** — missing a path that
  rails-comparison should catch (e.g. a `conventions.ts` edit that regenerates
  `docs/ruby-ts-conventions.md`). Mirror the existing AR gate's path set exactly
  and force-true on push/main so the post-merge sweep always runs the full
  comparison as a backstop.

## Notes

Be conservative: when in doubt, gate true. The existing `changes` job already
has extensive comments documenting each package's dependency closure — extend
that pattern, don't invent a new one.
