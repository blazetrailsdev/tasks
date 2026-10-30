---
title: "ringo: TestResetEpochResolvesTheLabelInTheScrapersZone fails on btwebooks main"
status: draft
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
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

`go test ./webhook` in btwebooks fails on `main` (3edc3fd) with `TestResetEpochResolvesTheLabelInTheScrapersZone` (`webhook/usage_reset_epoch_test.go:62`). Every other webhook test passes. Found while verifying the branch for trailmap#96. The test is probably time-zone or date sensitive. A red suite on `main` hides real regressions in any ringo change.

## Acceptance criteria

- Find why the test fails on this host, and fix either the test or the reset-epoch code.
- `go test ./webhook` passes on btwebooks `main`.
