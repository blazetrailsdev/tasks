---
title: "Hash#extract! is unreachable from outside activesupport — give it a subpath export"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6468
claim: "2026-08-13T15:19:07Z"
assignee: "merge-clauses-where-clause-structure"
blocked-by: null
closed-reason: null
---

## Context

Introduced by PR #6455 while rebasing onto a sibling's `Array#extract!` port.

`Hash#extract!` (`vendor/rails/activesupport/lib/active_support/core_ext/hash/slice.rb:24-26`)
is ported as `extractBang` in `packages/activesupport/src/hash-utils.ts`, but it
is NOT re-exported from `packages/activesupport/src/index.ts`: `Array#extract!`
(`core_ext/array/extract.rb`) landed first and owns the `extractBang` spelling
on the flat index (exported from `array-utils.ts`).

In Ruby the two never collide — they are methods on different receivers. In a
flat ESM namespace they do. PR #6455 documented the split in index.ts next to
the identical `core-ext/range` and `core-ext/date` notes, and pointed the one
in-package caller at `./hash-utils.js`.

The gap is that an OUT-OF-PACKAGE consumer of `@blazetrails/activesupport`
cannot reach the hash arm at all — the same gap
`date-ext-reachable-under-its-rails-subpath` closed for the `Date` arm of
`core_ext/date/calculations.rb`.

## Converged shape

Give `hash-utils.ts`'s hash arm a subpath export mirroring its Rails require
path (`active_support/core_ext/hash/slice`), exactly as
`./core-ext/date/calculations` and `./core-ext/range/conversions` are spelled
today in `packages/activesupport/package.json`.

Note the registration cost — a cross-package subpath needs FOUR registrations,
not just the `exports` map: the package `exports`, the vitest alias in
`vitest.config.ts`, and BOTH dx-test tsconfigs
(`packages/activerecord/dx-tests/tsconfig.json`,
`packages/activerecord/virtualized-dx-tests/tsconfig.json`). `pnpm typecheck`
does not catch a missing one.

Consider whether the whole of `hash-utils.ts` should move under
`core-ext/hash/*` files matching the Rails layout, which would make the subpath
fall out naturally rather than being bolted onto an aggregate module — that is
the larger option and may belong to its own story.

## Acceptance criteria

- [ ] `Hash#extract!` is importable from outside the package under a subpath
      that mirrors its Rails require path.
- [ ] `Array#extract!` still resolves as `extractBang` on the flat index; no
      name shadows another.
- [ ] The subpath is registered in all four places listed above.
