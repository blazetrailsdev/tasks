---
title: "Vips magickload fallback honours n and surfaces ImageMagick stderr"
status: draft
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9697 added a magickload fallback in `packages/image-processing/src/vips.ts`
(`vipsForeignLoadMagick`): wasm-vips links no ImageMagick, so an unknown-format
file is converted by the ImageMagick CLI (`file[page]` → PNG tempfile) and loaded.
libvips' `magickload` also takes `n` (number of pages, `-1` for all) and
`page`/`density`; the port forwards only `page` and `density`, and `n` was
dropped from `INTROSPECT_OPTIONAL_INPUT.magickload`. An ImageMagick failure
rethrows the original "not a known file format" vips error without IM's stderr.

## Acceptance criteria

- `n` is honoured: pages `page..page+n-1` are loaded and joined vertically with
  `page-height` set, as libvips magickload does; `n` is restored to the
  `magickload` options list.
- An ImageMagick failure's stderr reaches the raised error (still a
  `WebAssembly.Exception`-catchable failure for `isValidImage`).
