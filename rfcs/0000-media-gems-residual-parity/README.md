---
rfc: "0000-media-gems-residual-parity"
title: "Media gems residual parity: image-processing, mini-magick, mini-mime and marcel"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "image-processing"
  - "mini-magick"
  - "mini-mime"
  - "marcel"
clusters: []
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Media gems residual parity: image-processing, mini-magick, mini-mime and marcel

## Summary

Close the residual gaps the image_processing, mini_magick, mini_mime and marcel
ports left after RFCs 0202, 0203 and 0201 closed.

## Motivation

`pnpm parity:api` / `parity:test` on 2026-11-09 (fresh build):

| Package          | api       | tests                        |
| ---------------- | --------- | ---------------------------- |
| image-processing | 63 / 105  | 178 / 178 (1 PERMANENT skip) |
| mini-magick      | 114 / 125 | 145 / 145                    |
| mini-mime        | 21 / 23   | 8 / 9                        |
| marcel           | 32 / 32   | 20 / 20 (1 PERMANENT skip)   |

The image-processing and mini-magick gaps are crediting: the methods exist, but
`Processor` is not seated on its module and `Image`'s readers come from a class
macro the extractor does not read.

## Design

Four stories, one per package. Prior art checked: the 0202 / 0203 / 0201
stories are all done or closed; `port-assert-output` (0206) touches
image-processing's test helper only and is not in scope.

## Non-goals

- **image-processing's thumbnail skip.** It is `PERMANENT-SKIP` under CLAUDE.md
  § "Method visibility is compile-time only".

## Alternatives considered

- **Keep marcel's skip.** Rejected: rack 3's wrapper meets the contract the test
  checks, so the skip is a version-naming gap, not a shortcoming.

## Rollout

1. `image-processing-processors-seated-on-their-modules`,
   `mini-magick-image-attribute-readers-credited`
2. `mini-mime-pread-file-and-mime-types-parity-test`, `marcel-input-wrapper-test-on-rack-3`

## Verification

`pnpm parity:api`: all four packages 100%. `pnpm parity:test`: all four 100%
matched, with image-processing's one `PERMANENT-SKIP` the only skip.

## Open questions

1. **Does the mime-types parity test port without the gem?** Resolved: vendor
   mime-types-data as data (no api/test comparison) and read it.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
