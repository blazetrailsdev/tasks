---
title: "Measure the differential harness's yield and decide whether it gates in CI"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "mri-differential"
packages: []
deps:
  - "mri-differential-type-cast-value-table"
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The harness and the value table are a bet. This story settles it with numbers, the way RFC 0113 settled arm comparison, so the cluster ends in a decision and not in a permanently half-adopted tool.

## Acceptance criteria

- Reported: real defects found that no existing story covered, artefact rate, wall-clock per run, and CI cost if added to the job that already runs the query pipeline (`.github/workflows/ci.yml:759`).
- A recommendation, backed by those numbers: gate in CI with the known-gaps file as an only-shrink baseline, keep as an on-demand report, or stop.
- If it gates: the next two generated-input targets are named, each filed as its own story (candidates: `Duration` arithmetic and `inspect`; HWIA and `Hash` core extensions).
- If it stops: the RFC README's Design section is updated to say so and why.
