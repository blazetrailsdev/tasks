---
title: "Take mini_magick to zero tsc errors and no any"
status: ready
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-polish
packages: ["mini-magick"]
deps: ["mini-magick-lib-native-idioms", "mini-magick-specs-native-and-typed"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`tsc -p packages/mini-magick` reports 463 errors at `5f96afb0a0`. Most come
from untyped `subject` / `let` in the specs, `unknown` instance variables in the
lib, and `MiniMagick` seat members the namespace type does not list. The two
stories this depends on remove most of them.

## Acceptance criteria

- `tsc -p packages/mini-magick` reports 0 errors.
- No `any`, explicit or as an inferred parameter, in `packages/mini-magick/src`.
- No `@ts-expect-error` or `as unknown as` cast where a real type would do.
