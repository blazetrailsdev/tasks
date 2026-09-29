---
title: "Replace the RUNNER_STATUS_TOKEN PAT with a GitHub App installation token"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #8242 routes the CI critical-path lane (AR SQLite or Unit Tests) to the self-hosted `debian-arm64` runners when one is idle. The idle check is the `self_hosted` step of the `changes` job in `.github/workflows/ci.yml`. It calls `GET /repos/{repo}/actions/runners` with `secrets.RUNNER_STATUS_TOKEN`, a **fine-grained PAT** (Administration: read-only) created by hand in the web UI. `GITHUB_TOKEN` cannot list runners.

A PAT expires, and when it does the routing fails **silently**: `gh api` errors, the step's `|| idle=0` fallback routes everything to `ubuntu-latest`, CI stays green, and the runners simply stop getting work. The token is also tied to one person's account.

A GitHub App installation token has neither problem: `actions/create-github-app-token` mints a fresh 1-hour token per run from an app id + private key stored as secrets.

## Acceptance criteria

- A GitHub App for the org with **Administration: read-only** on `blazetrailsdev/trails`, installed on the repo; its app id and private key stored as repo secrets.
- The `changes` job mints the token with `actions/create-github-app-token` (SHA-pinned like the repo's other third-party actions) and passes it to the `self_hosted` step as `GH_TOKEN`. The step's fallback for a missing or failing token stays as it is.
- Fork PRs still receive no secrets and still route to hosted.
- `RUNNER_STATUS_TOKEN` is deleted once a labelled run shows the app token routing a lane to `debian-arm64*`.
