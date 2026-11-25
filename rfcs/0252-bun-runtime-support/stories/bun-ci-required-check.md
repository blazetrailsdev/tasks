---
title: "Make the Bun CI job a required check"
status: ready
updated: 2026-11-25
rfc: "0252-bun-runtime-support"
cluster: ci
packages: [trailties]
deps: [bun-generated-app-smoke-ci]
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Open question 1, recommendation (b).

## Acceptance criteria

- [ ] After two weeks of green runs, the Bun job drops `continue-on-error` and becomes a required check.
