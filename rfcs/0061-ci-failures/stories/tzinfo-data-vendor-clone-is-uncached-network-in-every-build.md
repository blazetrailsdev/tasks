---
title: "tzinfo-data-vendor-clone-is-uncached-network-in-every-build"
status: done
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10783
claim: "2026-11-26T03:14:44Z"
assignee: "ci-ar-adapter-shards-dynamic-work-queue"
blocked-by: null
closed-reason: null
---

## Context

On run 44977404735 (trails#10546), `Unit Tests (1)` failed in `pnpm build`, before any test ran. `packages/tzinfo/package.json:24` (`build:data`) runs `pnpm -w vendor:fetch --source tzinfo-data` whenever `vendor/tzinfo-data/v1.2026.5/.git` is absent, which does a `git clone --depth=1 --branch v1.2026.5 https://github.com/tzinfo/tzinfo-data.git`. The runner couldn't reach github.com ("Failed to connect to github.com port 443 after 133255 ms"), so the build failed. The PR touched nothing in tzinfo. Every CI job that builds tzinfo makes this network clone, with no cache and no retry.

## Acceptance criteria

- The tzinfo-data checkout is restored from an `actions/cache` keyed on the pinned ref (`v1.2026.5`), or the generated `dist/tzinfo-data` is cached, so a warm build makes no network clone.
- On a cold cache, the fetch retries with backoff before failing.
- A job that never imports tzinfo doesn't trigger the clone.
