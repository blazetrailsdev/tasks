---
title: "flip-rack-deflater-onto-the-zlib-seam"
status: claimed
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

PR for `zlib-seam-is-the-last-static-node-builtin` added
`packages/ruby-compat/src/zlib-adapter.ts` (the `getZlib()` registry, in the
`os-adapter.ts` shape) and flipped `packages/activesupport/src/gzip.ts` onto it,
removing that file from the `no-node-builtins` ignore list in
`eslint.config.mjs`. It deliberately did NOT flip the other entry on that ignore
line, `packages/rack/src/deflater.ts:1` (`import * as zlib from "zlib"`, used at
`deflater.ts:124,126`).

Reason, measured on that branch: the flip was written and reverted. Replacing
`new Promise((resolve, reject) => { zlib.gzip(input, cb) })` with a synchronous
`getZlib().gzip(...)` removes the only `new` in `Deflater#compress`, and
`parity:api:calls` immediately reports

````text
+ rack  deflater.ts  call  new  (rack/deflater.json)
```text

because Rails' counterpart body makes `::Zlib::GzipWriter.new(self)`
(`vendor/rack/lib/rack/deflater.rb:101`). The seam flip is therefore only worth
doing together with converging that call — otherwise it buys a browser-safe
import at the cost of a new call-set baseline row, which is making debt.

## Acceptance criteria

- [ ] `packages/rack/src/deflater.ts` no longer statically imports `zlib`, and
      its entry is removed from the `ignores` list in `eslint.config.mjs`
      (the entry carries a comment pointing at this story today).
- [ ] `pnpm parity:api:calls` is green with NO new row in
      `scripts/api-compare/call-mismatches-exclude/rack/deflater.json` — the
      `Zlib::GzipWriter.new` call (`vendor/rack/lib/rack/deflater.rb:101`) is
      converged, not baselined. That likely means porting `GzipStream`
      (`deflater.rb:88-125`) rather than the current ad-hoc `compress` helper.
- [ ] `ZlibAdapter` grows whatever the port needs (a `GzipWriter`-shaped
      streaming member, if `deflater.rb`'s `gzip.write` / `gzip.flush` loop is
      ported faithfully); any new member carries a resolving
      `vendor/ruby/ext/zlib/zlib.c:<line>` citation and a
      `@noRailsEquivalent PERMANENT` receipt, as every member of that file does.
- [ ] `pnpm vitest run packages/rack/src/deflater.test.ts` (29 tests) stays green.
````
