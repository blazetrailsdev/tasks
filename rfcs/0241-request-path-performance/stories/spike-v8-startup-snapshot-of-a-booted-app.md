---
title: "Spike: a V8 startup snapshot of a booted trails app"
status: in-progress
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10337
claim: "2026-11-19T02:51:40Z"
assignee: "stimulus-controller-generator"
blocked-by: null
closed-reason: null
---

## Context

A trails app's cold start is dominated by boot (about 0.9–1.9 s), as measured in the serverless spike.
A V8 startup snapshot (`node --build-snapshot`) of a booted app could remove most of it, but the
ESM/top-level-await entry (`export default await Trails.initialize()`) is not snapshot-compatible today.

## Acceptance criteria

- Spike: determine what a snapshot-able boot needs (a CJS or sync entry, deferred I/O, and
  re-establishing connections after deserialize), and measure the cold start of a
  snapshotted minimal app.
- Write up the findings with go/no-go and the follow-up stories. No production code is
  required.
