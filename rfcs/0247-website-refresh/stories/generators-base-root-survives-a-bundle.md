---
title: "generators-base-root-survives-a-bundle"
status: in-progress
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10822
claim: "2026-11-26T22:34:25Z"
assignee: "generators-base-root-survives-a-bundle"
blocked-by: null
closed-reason: null
---

## Context

The playground (`examples/browser-sqlite`) cannot run `trails generate` yet (story `playground-generators-and-example-apps`). Two things in trailties block it under a bundler:

- `Generators::Base.baseRoot()` (`packages/trailties/lib/generators/base.ts:261-264`) reads `new URL(import.meta.url).pathname`. In a Vite bundle that is `/assets/base-<hash>.js`, so `defaultGeneratorRoot` / `defaultSourceRoot` / `usagePath` never find `templates/` or `USAGE`. Rails derives it from `__dir__` (`railties/lib/rails/generators/base.rb`); trails' other framework paths use `import.meta.dirname`, which the playground's build rewrites (`vite.config.ts`'s `importMetaPaths`).
- `Generators.lookup` / `requireGenerator` (`packages/trailties/lib/generators.ts:139-170,412-424`) find a generator by probing `LOAD_PATH` for `<path>-generator.js` and `import()`ing its file URL. The playground can seat a re-export shim at that VFS path, but the 328 template files under `dist/generators/**/templates` must also be seated.

## Acceptance criteria

- `baseRoot` reads `import.meta.dirname` (or equivalent the bundle rewrite covers), so a bundled generator finds its templates.
- A note in the playground story of what seating the generators then needs.
