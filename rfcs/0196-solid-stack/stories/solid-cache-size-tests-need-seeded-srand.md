---
title: "solid-cache-size-tests-need-seeded-srand"
status: in-progress
updated: 2026-11-15
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10156
claim: "2026-11-15T22:21:36Z"
assignee: "solid-cache-size-tests-need-seeded-srand"
blocked-by: null
closed-reason: null
---

# Port Kernel#srand and the seeded SolidCache size-estimate tests

## Context

`vendor/solid_cache/v1.0.7/test/models/solid_cache/entry/size_test.rb`,
`entry/size/estimate_test.rb` and `entry/size/moving_average_estimate_test.rb`
seed the RNG through `with_fixed_srand` (`srand(seed)` around a block) and
assert sizes that depend on MRI's Mersenne Twister sequence
(`rand**2 * 1000` value lengths; `Estimate#sample_range` uses `rand`).
ruby-compat's `Kernel` has `rand` but no `srand`, and its `rand` is not
MT19937 (`vendor/ruby/v3.3.11/random.c`), so these tests cannot be ported:
"test larger sample estimates", "test with gaps in records estimates",
"test with more gaps in records estimates", "overestimate when all samples
sizes are the same" (size_test, estimate_test), "tracks moving average",
"appends to moving average when less than required items".
The unseeded tests from those files are in
`packages/solid-cache/test/models/solid-cache/entry/**`.

## Acceptance criteria

- ruby-compat `Kernel.srand` / `Kernel.rand` reproduce MRI's MT19937
  sequence for a given seed (`random.c` `rand_init`, `genrand_real`, `rand_int`).
- The listed tests are ported under their Rails names with Rails' expected values.
