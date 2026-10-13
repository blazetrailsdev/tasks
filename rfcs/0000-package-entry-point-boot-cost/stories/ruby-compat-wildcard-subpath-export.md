---
title: "ruby-compat: add a wildcard subpath export so every module is reachable without the barrel"
status: draft
updated: 2026-10-13
rfc: "0000-package-entry-point-boot-cost"
cluster: "findings"
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/ruby-compat/package.json` `exports` names `"."` plus 8 subpaths
(`./include`, `./method-missing-proxy`, `./name-error`, `./psych`,
`./psych-adapter`, `./range`, `./yaml`) and has **no wildcard**. The package
ships 147 `dist/*.js` files, so 139 of them are reachable only through the
barrel.

Measured cost of the barrel (loader-hook module count, median of three warm
`await import()` runs):

| Specifier                             | Modules | Time  |
| ------------------------------------- | ------- | ----- |
| `@blazetrails/ruby-compat`            | 139     | 147ms |
| `@blazetrails/ruby-compat/range`      | 54      | 66ms  |
| `@blazetrails/ruby-compat/name-error` | 5       | 3ms   |

This story unblocks the per-consumer migration batches; it changes no call
sites itself. `actionview` already carries `"./*"`, so this is the established
shape in this repo, not a new convention.

## Acceptance criteria

- [ ] `packages/ruby-compat/package.json` `exports` gains
      `"./*": { "types": "./dist/*.d.ts", "default": "./dist/*.js" }`
- [ ] The 8 existing named subpaths and `"."` are left in place and unchanged
- [ ] `import { Range } from "@blazetrails/ruby-compat/range"` and a
      previously-unreachable module both resolve and typecheck from another
      workspace package
- [ ] `pnpm build`, lint and the full test suite are unchanged

## Definition of done

Removing or narrowing the `"."` barrel does not close this story — the change
is additive, and 1795 call sites still depend on the barrel.

## Verification

```bash
pnpm build
node --input-type=module -e "import('@blazetrails/ruby-compat/name-error').then(()=>console.log('ok'))"
```

## Notes

The barrel is a pure re-export hub: 146 exports, no side effects. If a
consumer's behaviour changes when it stops importing the barrel, that means a
module had an import side effect — stop and report it, because it invalidates
the premise of the whole RFC.
