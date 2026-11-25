---
title: "Ship an esbuild preset for the trails-specific Lambda / Workers bundle workarounds"
status: done
updated: 2026-11-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10733
claim: "2026-11-25T12:25:55Z"
assignee: "root-marker-and-rackup-resolve-compiled-config"
blocked-by: null
closed-reason: null
---

## Context

The two serverless examples each carry an esbuild script
(`examples/cloudflare-worker/bundle.mjs`, `examples/serverless-lambda/bundle.mjs`)
that works around the same trails-specific problems:

- a `createRequire` banner so CommonJS dependencies resolve inside an ESM bundle
  (both);
- `import.meta.url` pinned to `file:///bundle/dist/worker.js` (Worker), because
  workerd has no file URL for the module;
- a `without-libxml2` plugin that blanks
  `packages/nokogiri/dist/extension.js` (Worker). The root cause is filed as
  `nokogiri-extension-fails-in-workerd-runtime-wasm-compile`;
- the `workerd` / `worker` export conditions and `external: ["node:*",
"cloudflare:*"]` (Worker).

Every user who deploys to Lambda or Workers will copy these. Rails has no
bundling step to port, so the preset is new surface and needs
`@noRailsEquivalent` receipts. The esbuild call itself (entry point, target,
splitting, minify) stays with the app.

## Acceptance criteria

- trailties, or a small package beside it, exports an esbuild plugin or preset
  covering the workarounds above. Its targets are `node` (Lambda) and `workerd`
  (Cloudflare Workers), and each export carries `@noRailsEquivalent`.
- Both example `bundle.mjs` files use it and keep only their entry point,
  target and output options. Both examples still build, and the Lambda
  `invoke:local` smoke still passes.
- The libxml2 stub is removed from the preset once
  `nokogiri-extension-fails-in-workerd-runtime-wasm-compile` lands. Until then
  the stub is named after that story.
