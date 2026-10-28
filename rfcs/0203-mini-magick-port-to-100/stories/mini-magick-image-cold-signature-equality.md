---
title: "Image#==/hash must not silently compare a cold (Promise) signature"
status: claimed
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-28T13:16:11Z"
assignee: "mini-magick-image-cold-signature-equality"
blocked-by: null
closed-reason: null
---

## Context

`MiniMagick::Image#==` / `#hash` (`vendor/mini_magick/v5.2.0/lib/mini_magick/image.rb:156-163`) read `signature`, which `Image::Info#signature` memoizes (`image/info.rb:112-114`, `@info["signature"] ||= self["%#"]`). In Ruby the identify runs in line, so a never-read image still compares correctly.

After trails#9396, `packages/mini-magick/src/image/info.ts` `signature()` returns `string | Promise<string>`: the cached String once it has been read, a Promise before that. `Image#equals` / `hash` (`packages/mini-magick/src/image.ts`) answer correctly only when the signature is warm. When it is cold they silently compare or hash a Promise, so `==` is false and `rbHash` is identity. `packages/mini-magick/src/image.trails.test.ts` pins this cold behaviour.

## Acceptance criteria

- A cold `==` / `hash` no longer answers silently. Either it raises (with the arm receipted against a ratified CLAUDE.md section), or the owner ratifies the warm-cache shape and `Image#equals` / `hash` carry a `PERMANENT` receipt citing it.
- `image.trails.test.ts` is updated to the converged behaviour.
