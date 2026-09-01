---
title: "zlib-seam-is-the-last-static-node-builtin"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
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

`packages/activesupport/src/gzip.ts:1` is the **only static Node-builtin import
left in `packages/activesupport/src/`**:

```ts
import { gzipSync, gunzipSync, deflateSync, inflateSync, constants } from "node:zlib";
```

Measured on this branch: `grep -rn 'from "node:' packages/activesupport/src
--include='*.ts' | grep -v test` returns **1 hit** (this one), against **13**
dynamic `import("node:…")` / `createRequire` hits, all inside the six adapter
registries. Everything else in activesupport already reaches Node lazily and is
browser-safe by construction; this line is the exception, and
`eslint.config.mjs:236` ignore-lists it as "Node-only modules exposed via
subpath imports (no browser equivalent)".

Two things make that ignore worth revisiting under RFC 0129 specifically:

1. **`Zlib` is MRI stdlib, not Rails.** The anchor is `vendor/ruby/`'s zlib ext,
   and the class this file declares is `Stream` — Ruby's `Zlib::GzipWriter` /
   `Zlib::GzipReader` seam that `ActiveSupport::Gzip`
   (`vendor/rails/activesupport/lib/active_support/gzip.rb`) wraps. Rails
   declares `ActiveSupport::Gzip`; it does **not** declare the Zlib primitives
   underneath. That is exactly the 0129 thesis — a Ruby primitive charged to a
   Rails-measured package.
2. **`zlib` has no entry in the adapter replacement table.**
   `eslint/no-node-builtins.mjs:9-28` maps only `fs`, `path` and `crypto` to
   `@blazetrails/activesupport` accessors. There is no `zlib-adapter.ts`
   alongside the six that exist (`fs`, `os`, `crypto`, `http`,
   `child-process`, `process`, `async-context`). So `zlib` is the one Node
   builtin the repo reaches statically with no seam at all, and any browser
   bundle that pulls `gzip.ts` — or `packages/rack/src/deflater.ts`, the other
   entry on the same ignore line — hard-fails at bundle time rather than at the
   call.

**Sequencing — this story does not decide the home.** Where a Ruby-named
primitive that needs a platform seam lives is the open question owned by
`ruby-named-file-dir-fileutils-facade`, which lays out three shapes and
recommends one (ruby-compat owns the Ruby-named surface plus its own
`register*Backend()`; activesupport forwards at registration time). The same
question blocks `move-tempfile-to-ruby-compat`. Adopting whatever that story
settles is the point of the dependency here — do **not** invent a fourth shape,
and do not relocate `gzip.ts` before it lands.

Scope is deliberately the seam, not the relocation: add the lazily-resolved
compression adapter in the shape the façade story settles, flip `gzip.ts` onto
it, and remove it from the eslint ignore list. Whether `Zlib` then moves into
ruby-compat is a follow-up this story files with the counts it measures.

## Acceptance criteria

- [ ] A compression seam exists in the shape settled by
      `ruby-named-file-dir-fileutils-facade`, resolving `node:zlib` lazily —
      matching the existing registries (`packages/activesupport/src/os-adapter.ts:29-90`
      is the smallest one to read as the template: registry `Map`, `register…`,
      sync `get…` with a `createRequire` fast path, async `get…Async`).
- [ ] `packages/activesupport/src/gzip.ts:1` no longer statically imports
      `node:zlib`, and the file is removed from the `ignores` list at
      `eslint.config.mjs:236`.
- [ ] `packages/rack/src/deflater.ts` is assessed against the same seam: either
      flipped in this PR if it fits the LOC ceiling, or filed as its own story
      with the `file:line`s, and its `eslint.config.mjs:237` ignore entry left
      in place with that story cited.
- [ ] Any new public name carries a resolving `vendor/ruby/<file>:<line>`
      citation and a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>`
      receipt — the registries this mirrors carry **zero** receipts today
      (measured: `grep -c '@noRailsEquivalent'` is 0 on all seven adapter
      files), which is debt this story must not extend.
- [ ] activesupport is ungated for extra surface today
      (`scripts/api-compare/extra-surface-mark.json` gates only activerecord,
      arel, ruby-compat), so state the measured `pnpm parity:api:extra --package
    activesupport` before/after in the PR body rather than relying on a gate
      to catch a regression.
- [ ] If any name lands in ruby-compat, note that ruby-compat is **pinned at
      `novel: 0`** — the only remedies are a receipt at the declaration or not
      adding the name. Never widen the mark.
- [ ] A follow-up story is filed for relocating `Zlib` proper into ruby-compat
      if this story concludes it should move, carrying the call counts measured
      here so no one re-derives them.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
