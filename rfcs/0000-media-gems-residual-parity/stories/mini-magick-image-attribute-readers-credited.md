---
title: "parity:api credits MiniMagick::Image's attribute-generated readers"
status: draft
updated: 2026-11-09
rfc: "0000-media-gems-residual-parity"
cluster: null
packages:
  - "mini-magick"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` mini-magick 114/125: `image.rb` 31/42 misses `type`, `width`,
`height`, `dimensions`, `size`, `human_size`, `colorspace`, `exif`,
`resolution`, `signature`, `data`. The gem defines them with the `attribute`
class macro (`vendor/mini_magick/v5.2.0/lib/mini_magick/image.rb`); trails runs
`Image.attribute("width")` (`packages/mini-magick/lib/image.ts:413-421`) and
declares the readers in a merged interface (:34-42), which the comparer reports
as `declarationOnly`. The port is faithful: the gem generates the readers
with a macro, and so does trails. So the fix is in the extractor, not the
port.

## Acceptance criteria

- [ ] trails' `scripts/api-compare/extract-ts-api.ts` credits a member that a
      class-body call `Klass.attribute("name")` generates, for the classes on an
      explicit list in `scripts/api-compare/config.ts` (only
      `MiniMagick::Image` here), so no other package's credit can move. A
      fixture test covers it.
- [ ] The merged-interface declarations stay; the readers are not rewritten
      as hand-written members.
- [ ] `pnpm parity:api` reports mini-magick 125/125.
