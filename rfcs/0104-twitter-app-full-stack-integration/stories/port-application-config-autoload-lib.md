---
title: "Port Configuration#autoloadLib and emit it from the generated application.ts"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: ["generate-app-subclassing-application"]
deps-rfc: []
est-loc: 80
priority: 37
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' generated `config/application.rb` calls
`config.autoload_lib(ignore: %w[assets tasks])`
(`railties/lib/rails/generators/rails/app/templates/config/application.rb.tt:17-20`).

`autoload_lib` is `railties/lib/rails/application/configuration.rb:180`
(`def autoload_lib(ignore:)` — pushes `root.join("lib")` onto
`autoload_paths` and `eager_load_paths`, minus the ignored subdirectories).
It has no trails counterpart (grepped `packages/trailties/src` — no
`autoloadLib`), so `trails new` omits the line (PR #6534).

## Converged shape

Port `Configuration#autoloadLib({ ignore })` mirroring
`configuration.rb:180` — same parameter name, same ignore handling, same
paths mutated — and emit `config.autoloadLib({ ignore: ["assets", "tasks"] })`
from the `trails new` application template.

## Acceptance criteria

- `Configuration#autoloadLib` exists and mutates the same path collections
  Rails does.
- The generated `src/config/application.ts` calls it; generator snapshot updated.
