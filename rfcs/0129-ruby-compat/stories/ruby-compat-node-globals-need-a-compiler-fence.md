---
title: "types: [] does not fence Node globals in ruby-compat — decide between a test-only project and the lint fence"
status: in-progress
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7442
claim: "2026-09-03T12:50:47Z"
assignee: "port-log-subscriber-remaining-subscribe-log-level"
blocked-by: null
closed-reason: null
---

## Context

`enforce-ruby-compat-leaf-and-browser-freedom` (PR #7383) asserted that
`"types": []` in `packages/ruby-compat/tsconfig.json` would make `Buffer`,
`process`, `__dirname` and `__filename` compile errors. It does not, and the
PR shipped a `no-restricted-globals` lint fence instead, on the record.

Measured on that PR's branch with `tsc -p packages/ruby-compat/tsconfig.json
--explainFiles`: `@types/node` still enters the program, not by automatic
inclusion (which `types: []` does suppress) but by a transitive
`/// <reference types="node" />` from `vite/dist/node/index.d.ts` and
`undici-types`, pulled in because the package's `*.trails.test.ts` files
`import … from "vitest"` and share one program with the runtime sources. The
story's own probe — `export const p = Buffer.from("x").length + process.pid;`
— therefore still compiles clean with `types: []` in place.

The lint fence (`eslint.config.mjs`, `no-restricted-globals` over
`packages/ruby-compat/src/**`, tests exempted) catches the same class in the
editor and on the pre-commit hook, and the dist-level guard
(`scripts/ruby-compat-leaf.test.ts`) catches the import half. What is missing is
the compiler saying no.

## Converged shape

Give ruby-compat a second TypeScript project for its tests
(`tsconfig.test.json`, referencing the main one), so the runtime sources compile
in a program that `@types/node` cannot reach and the probe above goes red at
`tsc` time. That is the only way to get it: the leak is program-wide, so no
per-file setting closes it.

The trade the earlier story did not price: the test project needs registering
in the root `references` and in `pnpm typecheck`, and the main project stops
emitting compiled `*.test.js` into `dist/` — which the leaf guard's one
exemption (`isCompiledTestFile`, `scripts/ruby-compat-leaf.ts`) exists for and
would then be dead. Decide whether the compile-time fence is worth a second
project per package, or whether the lint fence is the settled answer; if the
latter, close this and delete the exemption.

## Acceptance criteria

- Either: ruby-compat's runtime sources compile in a program with no
  `@types/node`, proven by the probe above going red, with the test project
  registered in the root tsconfig `references` and typechecked in CI; the
  now-dead `isCompiledTestFile` exemption removed.
- Or: the story is closed with the measurement above as the reason, and the
  `no-restricted-globals` fence is documented in RFC 0129 as the settled answer.
- `pnpm typecheck` and `pnpm build` green for ruby-compat and every dependent.
