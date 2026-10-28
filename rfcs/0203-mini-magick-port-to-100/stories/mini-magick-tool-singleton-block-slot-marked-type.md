---
title: "mini-magick-tool-singleton-block-slot-marked-type"
status: done
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9412
claim: "2026-10-28T16:25:34Z"
assignee: "mini-magick-extra-surface-gate-enrollment"
blocked-by: null
closed-reason: null
---

## Context

`packages/mini-magick/src/mini-magick.ts` defines each `MiniMagick.<tool>`
singleton, the port of `define_singleton_method(tool) do |**options, &block|`
(`vendor/mini_magick/v5.2.0/lib/mini_magick.rb:26-28`). Since trails#9398 it
reads a `block()`-marked trailing argument with `rbBlockGivenP` and forwards it
to `Tool.new` (`tool.rb:30-39`). Its parameter type still admits an UNMARKED
`(tool: CliTool) => unknown`. A raw callback is then read as `options` and the
block is silently dropped, where Ruby has no way to pass a block except `&`.

## Acceptance criteria

- The block slot of the singleton type (and of `Tool.new` / `Tool#stack` in
  `tool.ts`) is typed as a marked block (`F & { [BLOCK]: true }`), so an
  unmarked callback fails to type-check.
- The block-param gate (`lint-block-params.ts`) stays green.
