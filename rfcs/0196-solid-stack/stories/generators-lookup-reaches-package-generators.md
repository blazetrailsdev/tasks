---
title: "generators-lookup-reaches-package-generators"
status: in-progress
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: trails#10012
claim: "2026-11-12T00:11:34Z"
assignee: "solid-queue-recurring-enqueue-event-flake"
blocked-by: null
closed-reason: null
---

## Context

`Generators.lookup` (`packages/trailties/src/generators.ts:116-137`) searches only
`Generators.lookupPaths()` (`:321-323`), which is trailties' own `generators/` directory. Rails'
`lookup` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb`) requires
`generators/<namespace path>` from `$LOAD_PATH`, so a gem's
`lib/generators/solid_cable/install/install_generator.rb` is found by `bin/rails generate solid_cable:install`.
`SolidCable::InstallGenerator` (`packages/solid-cable/src/generators/solid-cable/install/install-generator.ts`, trails#9449)
cannot be reached from `trails generate` today.

## Acceptance criteria

- `trails generate solid_cable:install` in a generated app finds and runs the solid-cable generator,
  through a lookup over installed packages' `generators/` directories (the load-path analogue).
- A test covers the namespace lookup reaching a package outside trailties.
