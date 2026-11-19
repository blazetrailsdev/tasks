---
title: "Compiled config files resolve import.meta.resolve against the original file"
status: draft
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10381 made `trails build` (`packages/trails-tsc/lib/build-autoload.ts`, `writeLoadFunction`) compile the routes, environments, initializers, seeds and environment files into `.trails/compiled/`, with each file's body wrapped in an exported function. A compiled body's `import.meta` is rebound to `__importMeta`, which copies `import.meta` and overrides `url`, `filename` and `dirname` to name the original file. The copied `import.meta.resolve`, however, still resolves against the compiled file. So in `config/initializers/x.ts`, `import.meta.resolve("./y.ts")` points into `.trails/compiled/config/initializers/`, not `config/initializers/`.

## Acceptance criteria

- `__importMeta.resolve(spec)` resolves a relative `spec` against the original file's URL: `new URL(spec, __importUrl).href`. A bare specifier still goes through `import.meta.resolve`.
- A `build-autoload.trails.test.ts` case shows that a compiled initializer's `import.meta.resolve("./sibling.ts")` names the original directory.
