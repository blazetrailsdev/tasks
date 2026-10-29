---
title: "Type MiniMagick::Tool subclass constants so convert_shim needs no cast"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9440
claim: "2026-10-29T16:07:40Z"
assignee: "image-processing-backend-tests-remainder"
blocked-by: null
closed-reason: null
---

## Context

`vendor/image_processing/v1.14.0/lib/image_processing/mini_magick.rb:8-14` (`convert_shim`) calls `::MiniMagick::Tool::Convert.new(&block)` in its fallback arm. In `packages/mini-magick/src/tool.ts` the per-tool subclasses (`Tool.Convert`, …) are installed with `Object.defineProperty` in a loop, so they have no static type. `packages/image-processing/src/mini-magick.ts` `convertShim` reaches it through `(Tool as unknown as { Convert: typeof Tool }).Convert.new(...)`. `convertShim` also returns `unknown`, so callers cast back to `CliTool`.

## Acceptance criteria

- `Tool.Convert` and its sibling tool classes are declared statics on `Tool` (typed), keeping the deprecated-constant warning.
- `convertShim` reads `Tool.Convert.new(...)` with no `as unknown as` cast, and returns a typed `CliTool | Promise<…>`.
