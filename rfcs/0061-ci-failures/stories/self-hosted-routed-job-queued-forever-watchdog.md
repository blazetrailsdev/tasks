---
title: "Cancel and re-run CI runs stuck queued on offline self-hosted runners"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #8242's `self_hosted` step in the `changes` job (`.github/workflows/ci.yml`) checks that a `debian-arm64*` runner is online and idle, then routes `sqlite-tests` or `unit-tests` to `["self-hosted","debian","ARM64"]`. If every matching runner goes **offline** between that check and job pickup, the routed job stays queued. `timeout-minutes` does not count queue time, and GitHub holds a queued job for up to 24h, so the required `CI` aggregator check never completes. The PR accepted this explicitly (the window is seconds; recovery is cancel + re-run, and the re-run's check falls back to hosted), but nothing detects it: a PR just sits yellow until someone notices.

## Acceptance criteria

- A scheduled workflow (e.g. every 10 min) finds runs whose jobs have been queued on the self-hosted labels for more than N minutes while no matching runner is online, cancels them, and re-runs them, so the re-run routes to hosted.
- It uses the same runner-status credential as the routing step and never touches runs whose jobs are merely waiting behind a busy (online) runner.
- A test or dry-run mode shows the selection logic against a recorded API response.
