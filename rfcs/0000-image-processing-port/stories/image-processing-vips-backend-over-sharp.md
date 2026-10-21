---
title: "Port ImageProcessing::Vips over sharp"
status: draft
updated: 2026-10-21
rfc: "0000-image-processing-port"
cluster: ip-backends
packages: ["image-processing"]
deps: ["image-processing-pipeline-and-processor"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`lib/image_processing/vips.rb` (228 lines) is ruled to wrap npm `sharp`
(2026-10-21). The RFC's Design table maps each processor method
(`resize_to_limit/fit/fill/cover`, `resize_and_pad`, `rotate`, `composite`,
the `SHARPEN_MASK` convolution at `vips.rb:22-24`, `load_image` / `save_image`,
`valid_image?`) onto sharp. Open questions 1–3 (unmapped operations, loader /
saver option introspection at `vips.rb:198-226`, metadata setters at
`vips.rb:149-152`) are ruled before this story starts.

`sharp` is an npm dependency with prebuilt libvips binaries, declared as an
optional peer like `pg` / `mysql2` in activerecord.

## Acceptance criteria

- Each Vips processor method produces sharp calls per the Design table;
  `Vips::MAX_COORD` is the one-dimension sentinel as in `default_dimensions`.
- Queued libvips names go through an explicit name → sharp table; a miss
  behaves as open question 1 rules.
- `vips_test.rb` (74 examples) passes, its expected images built with sharp,
  each remaining skip a `PERMANENT-SKIP` citing a ruling.
