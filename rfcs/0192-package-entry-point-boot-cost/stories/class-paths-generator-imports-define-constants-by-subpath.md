---
title: "class-paths-generator-imports-define-constants-by-subpath"
status: draft
updated: 2026-11-24
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every package's generated constant tables (`packages/*/lib/constants*.generated.ts`, 264 files) start with
`import { defineConstants } from "@blazetrails/ruby-compat";`. The import is emitted by
`scripts/api-compare/class-paths.ts:569`. `defineConstants` is owned by `packages/ruby-compat/lib/classpath.ts`.
The tables run at boot, so each package that migrated off the barrel under RFC 0192 Phase 2
(for example actionpack in trails#10707) still loads the whole 139-module barrel through its own table.

## Acceptance criteria

- [ ] `class-paths.ts` emits `import { defineConstants } from "@blazetrails/ruby-compat/classpath";`
- [ ] `pnpm parity:class-paths` regenerates every table, and the regenerated tables are committed
- [ ] `grep -rl 'from "@blazetrails/ruby-compat"' packages/*/lib/constants*.generated.ts` returns nothing
- [ ] The boot-graph harness's ruby-compat count does not rise; if it falls, rerun with `--write`
