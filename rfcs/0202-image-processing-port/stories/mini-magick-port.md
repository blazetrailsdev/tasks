---
title: "Port mini_magick, shelling out to ImageMagick through child_process"
status: draft
updated: 2026-10-21
rfc: "0202-image-processing-port"
cluster: mini-magick
packages: ["mini-magick"]
deps: ["vendor-image-processing-and-mini-magick"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`mini_magick` 5.2.0 (`lib/` ~1,280 lines: `image.rb` 609, `tool.rb` 274,
`image/info.rb` 151, `configuration.rb` 101, `shell.rb` 53) builds ImageMagick
argument lists and runs them: `MiniMagick::Shell#execute` (`shell.rb:29-35`) is
`Open3.capture3(env, *command, stdin_data: stdin, unsetenv_others: …)` under
`MiniMagick.timeout`, raising `MiniMagick::Error` / `TimeoutError`
(`mini_magick.rb:11`). `MiniMagick.imagemagick7?` (`mini_magick.rb:19-22`) picks
`magick` when it is on PATH, else the IM6 tools (`convert`, `identify`,
`mini_magick.rb:27`). Ruled 2026-10-21: the port shells out the same way.

Its specs are RSpec (`spec/lib/mini_magick/{image,tool,shell,utilities}_spec.rb`,
~137 examples). Start from the generator's output, marcel-style (RFC 0201), on
a branch; land as a new `packages/mini-magick`.

## Acceptance criteria

- `Shell#execute` runs the argv with `child_process` (no shell string), passes
  stdin and the restricted environment, enforces the timeout, and answers
  `[stdout, stderr, status]`; everything above it is async.
- `Tool`, `Image`, `Image::Info`, `Configuration` and `Utilities` are ported at
  their Rails-style names; GraphicsMagick stays configuration.
- The specs pass against ImageMagick installed in CI (IM6 and IM7 paths both
  reachable by configuration); any skip is a `PERMANENT-SKIP` with a reason.
- The package is registered in CI like marcel (`ci.yml`, workspace, guard
  fixtures).
