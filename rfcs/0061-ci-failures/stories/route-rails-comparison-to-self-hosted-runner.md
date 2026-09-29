---
title: "Route rails-comparison to an idle self-hosted runner once vendored sources persist outside the checkout"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With PR #8242 merged, a non-AR PR's critical path moves from Unit Tests (363s avg on `ubuntu-latest`, 174s on `debian-arm64`) to **Rails API/Test Comparison** (~250s avg, 291s max across 41 recent non-AR runs). So the next lane worth routing to an idle self-hosted runner is `rails-comparison` (`.github/workflows/ci.yml`).

Two things block a naive move:

- It runs `ruby/setup-ruby` and `pnpm vendor:fetch`, which downloads upstream Rails/Ruby sources over the home connection. `actions/checkout` runs `git clean -ffdx` on every job, so a gitignored `vendor/` in the workspace would be wiped and re-fetched every run: the WAN-egress failure mode (a previous home runner used ~1 TB in 36h).
- The runner has Ruby 3.3 from apt; the job pins its Ruby via `ruby/setup-ruby`.

## Acceptance criteria

- Measure first: `rails-comparison` on `debian-arm64` against hosted, with the network bytes the VM received. Stop and record the result if it is not a clear win.
- If it is: vendored sources live outside the checkout on the runner (a fixed directory that `vendor:fetch` fills once per `ref`), so a warm run downloads nothing from upstream; the Ruby version matches what the job needs; and the `self_hosted` step routes `rails-comparison` only when it is the run's critical path and a runner is idle, falling back to hosted exactly as the SQLite / Unit Tests routing does.
