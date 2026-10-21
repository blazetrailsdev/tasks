---
title: "Perceptual-hash test helper for image_processing's assert_similar"
status: draft
updated: 2026-10-21
rfc: "0000-image-processing-port"
cluster: ip-backends
packages: ["image-processing"]
deps: ["vendor-image-processing-and-mini-magick"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`test/test_helper.rb:30-51` defines `assert_similar` / `refute_similar`
(distance `<=` / `>` 3) over `DHashVips::IDHash.fingerprint` and `distance`
(the `dhash-vips` gem), plus `fixture_image`, `copy_to_tempfile` and
`assert_dimensions` (`Vips::Image.new_from_file(path).size`). Both backend test
suites depend on them. Open question 4 rules which hash.

## Acceptance criteria

- The test helper exports `fixtureImage`, `copyToTempfile`, `assertDimensions`
  and the similarity assertions as vitest matchers or functions, per
  CONTRIBUTING.md "Porting a Minitest assertion".
- The hash computes over sharp's raw pixels; with IDHash ported, distances on
  the gem's fixtures match `dhash-vips` (threshold 3).
