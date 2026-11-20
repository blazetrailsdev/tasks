---
title: "stimulus-rails test:compare reaches 100%"
status: ready
updated: 2026-11-20
rfc: "0235-hotwire-via-vite"
cluster: null
packages: ["stimulus"]
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

## Goal

Bring `pnpm parity:test --package stimulus-rails` to 100% (operator ruling 2026-11-20). API is already 6/6 (100%).

## Measured (origin/main 6267d8913)

1/14 (7.1%), 13 misplaced: all 13 generator_test.rb tests live in `packages/stimulus/test/generators/generator.test.ts`; convention expects `packages/stimulus/test/generator.test.ts`. Move the file (or fix the mapping) so they count; verify all 13 still pass.
