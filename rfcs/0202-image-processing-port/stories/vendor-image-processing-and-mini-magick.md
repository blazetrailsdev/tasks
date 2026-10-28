---
title: "Vendor image_processing 1.14.0 (mini_magick 5.2.0 is already vendored)"
status: claimed
updated: 2026-10-28
rfc: "0202-image-processing-port"
cluster: ip-vendor
packages: ["image-processing"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-10-28T16:28:55Z"
assignee: "vendor-image-processing-and-mini-magick"
blocked-by: null
---

## Context

`vendor/rails/v8.0.2/Gemfile.lock` resolves `image_processing (1.14.0)` (`:289`,
depending on `mini_magick (>= 4.9.5, < 6)` and `ruby-vips (>= 2.0.17, < 3)`)
and `mini_magick (5.2.0)` (`:352`). mini_magick is already in
`vendor/sources.ts` (the `mini_magick` source, `ref: "v5.2.0"`, added by RFC
0203); image_processing is not. The entries there are the shape: `ref`, `libPath`, `libEntryFile`,
`compareApi: false`, `compareTests: false` until the package is ported.

Source: `https://github.com/janko/image_processing` tag `v1.14.0`.

## Acceptance criteria

- image_processing is an entry in `vendor/sources.ts` and
  `vendor/sources.lock.json`, fetched by `pnpm vendor:fetch` to
  `vendor/image_processing/v1.14.0`, comparison off; the mini_magick entry is
  untouched.
- Their test fixtures (image_processing's `test/fixtures/*.jpg|png`) are
  reachable from the vendored tree.
