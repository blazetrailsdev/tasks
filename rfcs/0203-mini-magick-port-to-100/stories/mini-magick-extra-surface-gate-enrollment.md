---
title: "mini-magick-extra-surface-gate-enrollment"
status: draft
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9398 enrolled mini-magick in `parity:api`, `parity:test`, the call-args
naming gate (`lint-call-args.ts`) and the param-name gate
(`param-name-mark.ts`), but not in the extra-surface gate
(`scripts/api-compare/extra-surface-mark.ts`). Adding it there reds with
`novel 0 → 12`, `total 0 → 33` (`pnpm parity:api:extra --package mini-magick --verbose`):

- `tool.ts`: `canvas`, `gradient`, `logo`, `pango`, `plasma`, `radialGradient`,
  `rose`, `xc` (novel), the creator operators Ruby defines with
  `define_method` (`vendor/mini_magick/v5.2.0/lib/mini_magick/tool.rb`), and
  `append`, `pattern`, `text` (moved).
- `image.ts`: the `attribute` macro readers (`type`, `width`, `height`,
  `dimensions`, `size`, `humanSize`, `colorspace`, `resolution`, `signature`,
  `data`, `exif`; `image.rb` `attribute`) and `get` for `#[]`.
- `configuration.ts`, `version.ts`: `[classModule]`.
- Every file: `toString`, the class-name answer for `Module#name`/`to_s`.

## Acceptance criteria

- Each name is credited to its Ruby definition (macro/`define_method`
  expansion in the extractor), deleted, or carries a
  `@noRailsEquivalent PERMANENT|CONVERGEABLE <story>` receipt.
- mini-magick joins `GATED_PACKAGES` in `extra-surface-mark.ts` with
  `pnpm parity:api:extra:gate` green and its internal mark row added.
