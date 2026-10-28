---
title: "mini-magick-image-hash-sync-over-async-signature"
status: in-progress
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9396
claim: "2026-10-28T11:49:07Z"
assignee: "mini-magick-image-hash-sync-over-async-signature"
blocked-by: null
closed-reason: null
---

## Context

`MiniMagick::Image#hash` is `signature.hash` (`vendor/mini_magick/v5.2.0/lib/mini_magick/image.rb`, `#hash`), and `#==` / `#eql?` compare `signature`. `signature` runs `identify`, which is async since trails#9380 (Shell over `Open3.capture3`). So `packages/mini-magick/src/image.ts` `hash()` / `equals()` now return promises. `rbHash` / `rbEqual` dispatch to a synchronous `hash()` / `eql()` (CLAUDE.md "Ruby protocol methods with a different JS mechanism"), so an `Image` in a `Hash` key or `uniq` groups wrongly.

## Acceptance criteria

- Decide the shape: either `hash` / `eql` answer synchronously from a signature already read (Info's cache), or the limit is ratified by the repo owner with a `PERMANENT` receipt.
- `image_spec.rb`'s `#==` / `#eql?` / `#hash` examples run.
