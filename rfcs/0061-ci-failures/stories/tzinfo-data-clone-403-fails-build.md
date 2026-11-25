---
title: "tzinfo-data-clone-403-fails-build"
status: in-progress
updated: 2026-11-25
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10759
claim: "2026-11-25T17:00:37Z"
assignee: "activestorage-many-attached-existing-blobs-order-flake"
blocked-by: null
closed-reason: null
---

## Context

"Trailties Tests (mailer-previews)" failed in `pnpm build` on trails#10661 (run 45268118907 job
138020843558): `pnpm -C packages/tzinfo build:data` found no `vendor/tzinfo-data/v1.2026.5` and ran
`vendor:fetch --source tzinfo-data`, whose `git clone --depth=1 https://github.com/tzinfo/tzinfo-data.git`
got `The requested URL returned error: 403`. The build cache was restored but the vendored data was not.

## Acceptance criteria

- [ ] CI jobs that build tzinfo get `vendor/tzinfo-data` from a cache/artifact instead of a live clone, or the fetch retries with backoff.
- [ ] A GitHub 403 on the clone no longer fails a trailties shard.
