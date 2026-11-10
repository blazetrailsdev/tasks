---
title: "Seat ImageProcessing::MiniMagick::Processor and ::Vips::Processor on their modules so parity:api credits them"
status: draft
updated: 2026-11-09
rfc: "0227-media-gems-residual-parity"
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
A grep of the 42 missing names against `mini-magick.ts` and `vips.ts`
(2026-11-09) finds all of them already defined except one predicate spelling:
`Processor.supportsResizeOnLoad` (`vips.ts:259`) for Ruby's
`supports_resize_on_load?`, which CLAUDE.md's predicate rule spells
`isSupportsResizeOnLoad`. `thumbnail` is ported and private, as in the gem; the
`PERMANENT-SKIP`ped "applies thumbnail operation" test is about its
visibility at `respond_to?`, not a missing method.

## Acceptance criteria

- [ ] `Processor` and `Utils` are seated on their module objects as the Ruby
      nesting has them (CLAUDE.md § "Call-time constant resolution": a plain
      `Namespace.Name = Klass` seat).
- [ ] `supportsResizeOnLoad` is renamed `isSupportsResizeOnLoad` with its call
      sites; no other member is expected to be missing. A residue after
      seating is filed as its own story, not absorbed here.
- [ ] `pnpm parity:api` reports image-processing 105/105.
