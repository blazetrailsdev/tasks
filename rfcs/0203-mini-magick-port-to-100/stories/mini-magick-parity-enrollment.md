---
title: "Enroll mini_magick in parity:api and parity:test at 100%"
status: in-progress
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-parity
packages: ["mini-magick"]
deps: ["mini-magick-typecheck-clean"]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9398
claim: "2026-10-28T13:16:11Z"
assignee: "mini-magick-image-cold-signature-equality"
blocked-by: null
---

## Context

`vendor/sources.ts` registers mini_magick (v5.2.0, `libPath:
"lib/mini_magick"`, `libEntryFile: "lib/mini_magick.rb"`, `testPath: "spec"`)
with `compareApi: false` and `compareTests: false`, so no parity gate measures
it. Its specs are RSpec, as Thor's are; `parity:test` reads RSpec through its
RSpec map (the trails memory note on Thor spec ports).

## Acceptance criteria

- `compareApi` and `compareTests` are true for mini-magick.
- `parity:api` and `parity:test` report mini-magick at 100%.
- `parity:api:calls`, `parity:api:calls:args`, `parity:api:params`,
  `parity:api:predicates` and `parity:api:extra` are green for mini-magick
  with no new baseline rows; any receipt follows CLAUDE.md's two shapes.
