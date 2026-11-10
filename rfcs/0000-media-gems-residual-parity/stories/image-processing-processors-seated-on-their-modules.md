---
title: "Seat ImageProcessing::MiniMagick::Processor and ::Vips::Processor on their modules so parity:api credits them"
status: draft
updated: 2026-11-09
rfc: "0000-media-gems-residual-parity"
cluster: null
packages:
  - "image-processing"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) image-processing 63/105: `mini_magick.rb` 9/30 and
`vips.rb` 9/30 miss `Processor#resize_to_limit`, `resize_to_fit`,
`resize_to_fill`, `resize_and_pad`, `resize_to_cover`, `rotate`, `composite`,
`thumbnail`, `load_image`, `save_image`, … and `Utils#*`, though the methods
exist (`packages/image-processing/lib/mini-magick.ts:75` `resizeToLimit`,
`vips.ts:278`). The `Processor` classes are module-private
(`mini-magick.ts:26`, `vips.ts:216`) and never seated on
`ImageProcessingMiniMagick` / `ImageProcessingVips` (`mini-magick.ts:283`,
`vips.ts:518`), so the extractor cannot qualify them as
`ImageProcessing::MiniMagick::Processor`
(`vendor/image_processing/v1.14.0/lib/image_processing/mini_magick.rb`). The
`Utils` modules and `MiniMagick#convert_shim`, `valid_image?` likewise.

## Acceptance criteria

- [ ] `Processor` and `Utils` are seated on their module objects as the Ruby
      nesting has them (CLAUDE.md § "Call-time constant resolution": a plain
      `Namespace.Name = Klass` seat).
- [ ] Any member still missing after crediting is ported.
- [ ] `pnpm parity:api` reports image-processing 105/105.
