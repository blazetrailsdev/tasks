---
title: "Stop recommending vars.RUNNER=self-hosted in ci.yml now that routing is idle-checked"
status: draft
updated: 2026-09-29
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.github/workflows/ci.yml`, the comment above `build-and-typecheck`: "`vars.RUNNER` is a single runner label … Today the plan is to set it to exactly `self-hosted`." After PR #8242 that plan is wrong. Setting `vars.RUNNER=self-hosted` would send the six `vars.RUNNER` jobs (build-and-typecheck, lint, guides-typecheck, leaf-tests, actionpack-tests, trailties-tests) to **any** self-hosted runner, including the offline x64 container runner, and would queue them there with no fallback. The measured result of doing that (closed PR #8240, all eligible jobs on one arm64 runner): 1103s end to end against ~780s hosted, because one runner serializes jobs the hosted pool runs in parallel. The supported way to use the self-hosted runners is now the idle-checked routing in the `changes` job's `self_hosted` step.

## Acceptance criteria

- The comment no longer recommends setting `vars.RUNNER=self-hosted`. It points at the `self_hosted` routing step as the way to use the self-hosted runners, or the `vars.RUNNER` knob is removed if nothing still needs it.
