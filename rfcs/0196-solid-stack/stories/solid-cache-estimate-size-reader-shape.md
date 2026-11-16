---
title: "solid-cache-estimate-size-reader-shape"
status: done
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10150
claim: "2026-11-15T20:21:41Z"
assignee: "local-cache-middleware"
blocked-by: null
closed-reason: null
---

# SolidCache Entry::Size::Estimate#size is a reader property

## Context

`Entry::Size::Estimate#size` (`vendor/solid_cache/v1.0.7/app/models/solid_cache/entry/size/estimate.rb`, `def size`) and `MovingAverageEstimate#size` (`moving_average_estimate.rb`, `attr_reader :size`) are both zero-arg readers. trails ports `MovingAverageEstimate#size` as a field but `Estimate#size` as an async method (`packages/solid-cache/lib/entry/size/estimate.ts:24`), so the two readers have different shapes. Found in trails#10112 review.

## Acceptance criteria

- Both readers have one shape. `Estimate` computes its size when it is built (its `static async new`) and exposes `size` as a property, as `MovingAverageEstimate` does.
- `MovingAverageEstimate#estimate` and the size tests read `size` without a call.
