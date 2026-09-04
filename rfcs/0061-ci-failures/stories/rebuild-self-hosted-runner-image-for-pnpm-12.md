---
title: "Rebuild the self-hosted runner image on pnpm 12.3.4"
status: draft
updated: 2026-09-04
rfc: "0061-ci-failures"
cluster: null
packages: []
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

PR #7489 bumped pnpm 11.5.1 -> 12.3.4 and moved `infra/runner/Dockerfile:15` to
`ARG PNPM_VERSION=12.3.4`, but **the self-hosted runner image was never
rebuilt**, so the deployed containers still ship pnpm 11.5.1. The repo and the
running image disagree today.

That is not currently breaking anything, and the reason is worth recording so
nobody "fixes" it the wrong way. `.github/actions/setup-pnpm/action.yml:76-79`
asserts the preinstalled `pnpm --version` exactly equals the `pnpm-version`
input, which reads as a hard lockstep — but the assertion runs inside the
checkout, and pnpm's `managePackageManagerVersions` (default on) makes any
pnpm >= 11 self-install the `packageManager` pin before answering. Verified from
a cold `HOME` with a freshly `npm install -g`'d 11.5.1, and confirmed on #7489's
CI, where every job logged `Done in ~5s using pnpm v12.3.4` off the un-rebuilt
image.

So this is an **optimization, not a repair**: each ephemeral container currently
re-downloads and self-installs pnpm 12 once, ~3 MB into `~/.cache/pnpm`. That
path is outside the mounted persistent store volume
(`/home/runner/.local/share/pnpm/store`), so it is re-fetched per job and never
cached. Small per job, permanent across every job on every PR.

Rebuilding also removes a latent dependency: without it, a green CI run relies on
each container reaching npm to fetch pnpm 12 at assertion time.

## Acceptance criteria

- Rebuild the Dokku `gh-runner` image from `infra/runner/Dockerfile` (already
  pinned at `PNPM_VERSION=12.3.4`) and cycle it with
  `dokku ps:scale gh-runner runner=N`.
- Confirm a self-hosted job logs the assertion passing with no self-install step
  — i.e. `pnpm --version` answers 12.3.4 from the image rather than after
  bootstrapping.
- No repo change should be required; if one is, the pin in
  `infra/runner/Dockerfile` and `.github/actions/setup-pnpm/action.yml:25` has
  drifted and should be re-checked against `package.json`'s `packageManager`.

## Notes

Ordering is unconstrained _because_ `managePackageManagerVersions` is on. If a
future story turns that setting off (see
[[pnpm12-lockfile-package-manager-document-churn]], which is the story that would
do it), this rebuild becomes a hard prerequisite that must land _before_ the
setting, with no green intermediate state — the assertion is exact-match in both
directions.
