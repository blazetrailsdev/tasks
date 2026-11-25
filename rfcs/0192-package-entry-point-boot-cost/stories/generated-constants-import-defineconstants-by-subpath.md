---
title: "generated-constants-import-defineconstants-by-subpath"
status: done
updated: 2026-11-25
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10719
claim: "2026-11-25T14:41:01Z"
assignee: "generated-constants-import-defineconstants-by-subpath"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts:569` emits `import { defineConstants } from "@blazetrails/ruby-compat";` into every package's `constants*.generated.ts`, so each generated table loads the full ruby-compat barrel. trails#10711 moved every hand-written actionview import to subpaths but left `packages/actionview/lib/constants{,.test-case,.testing-resolvers}.generated.ts` on the barrel, because changing the generator rewrites every package's tables.

## Acceptance criteria

- [ ] The generator emits `import { defineConstants } from "@blazetrails/ruby-compat/classpath";` (`defineConstants` is owned by `ruby-compat/lib/classpath.ts`)
- [ ] Every `constants*.generated.ts` is regenerated, and the class-path freshness check passes
- [ ] The boot-graph baseline is rerun with `--write` if ruby-compat's loaded count drops
