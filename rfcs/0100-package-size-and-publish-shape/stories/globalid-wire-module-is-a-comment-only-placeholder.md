---
title: "globalid publishes ./wire, a comment-only placeholder module"
status: draft
updated: 2026-09-03
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid/src/wire.ts` has no code in it. Its entire content is a
five-line `//` block saying that GID-4 will register the Locator and the
`findGlobalId` / `findSignedGlobalId` class methods onto `ActiveRecord::Base`
here, through a registration callback rather than a direct import, because
`base.ts` already imports this file.

The package sweep (#7461) surfaced it: `no-freeform-comments` does not report a
file that is only comments (`Program:exit` returns early on an empty
`program.body`), so it is the one file in the swept trees that kept its prose.
It was left as-is there rather than emptied, because the file is also a
published entry point — `packages/globalid/package.json:13-16` exports
`./wire` → `dist/wire.js` — so deleting it is an export-map change, not a
comment edit.

CLAUDE.md forbids the shape outright: "Do NOT add empty stubs or placeholder
interfaces. If a feature isn't implemented yet, don't create an empty file for
it."

The Rails counterpart is `globalid/lib/global_id/railtie.rb:19-40`, whose
`initializer "global_id"` block runs
`ActiveSupport.on_load(:active_record) { require "global_id/identification";
include GlobalID::Identification }` — i.e. the wiring is an `on_load` hook in
the railtie, not a bare side-effect module. `globalid-railtie-to-trailtie` in
this RFC ports that railtie.

## Converged shape

Either:

- the wiring lands here, as the `on_load(:active_record)` hook
  `railtie.rb:19-40` describes — at which point the file has a body and the
  export earns its place; or
- the file and its `./wire` export are deleted, and the trailtie story adds the
  hook where Rails puts it.

Pick one with `globalid-railtie-to-trailtie` in view; do not leave a
comment-only module behind either way.

## Acceptance criteria

- [ ] `packages/globalid/src/wire.ts` either carries the registration it
      describes or is deleted along with its `package.json` `./wire` export.
- [ ] No comment-only module is left in `packages/globalid/src`.
- [ ] `pnpm lint`, `pnpm typecheck` and the globalid suite clean.
