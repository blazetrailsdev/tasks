---
title: "Re-enable the Website CI job now its build is fixed"
status: closed
updated: 2026-08-17
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "closed from dashboard"
---

## Context

PR #6482 disabled the `Website` CI job because its build was failing on every
`main` push. The root cause has since been fixed on `main` by #6479 (stub
activesupport's relative yaml import in the service-worker bundle), and the
story that tracked it — `0061-ci-failures/website-build-top-level-await` — is
`done`. Nothing currently tracks turning the job back on, so it will stay off
by default.

The disable is two sites in `.github/workflows/ci.yml`, both commented:

- the `website:` job (`ci.yml:1309`) — a leading `false &&` on its `if:`, with
  the original `docs_only` / `website_affected` / `website_label` condition
  intact underneath.
- the `ci` aggregate's `website)` skip case (`ci.yml:~1950`) — an
  unconditional `continue`, needed because a `main` push runs
  `force_all_affected`, so `website_affected=true` and the original guard would
  fall through to "Unexpectedly skipped job: website" — moving the red from
  `Website` to `CI` rather than removing it.

Worth deciding as part of this, not just reverting: the job is gated on
`packages/website/**` or a `website`/`release` label, so it does **not** run on
ordinary PRs. That is why the breakage reached `main` unseen in the first
place — a package-source change (`packages/activesupport/src/yaml.ts`) broke a
bundle no PR check builds. Re-enabling as-is restores the same blind spot.
Options: widen the gate to the SW bundle's actual import graph, or accept that
`main` is where it is caught and keep the narrow gate.

## Acceptance criteria

- Confirm the `Website` job passes on current `main` before flipping it back
  on (run it via `workflow_dispatch` or a `website`-labelled PR).
- Delete the leading `false &&` from the `website:` job's `if:` and remove the
  now-stale TEMPORARILY DISABLED comment.
- Restore the `ci` aggregate's `website)` guard in place of the unconditional
  `continue` — the exact shape is quoted in the comment at that site:
  `if [ "$WEBSITE_AFFECTED" = "false" ] && [ "$WEBSITE_LABEL" != "true" ]`.
- State a decision on the PR-blindness above: either widen the gate (and say
  what to), or record that `main` is the intended catch point.
- `pnpm vitest run scripts/ci-suite-coverage.test.ts` stays green.
