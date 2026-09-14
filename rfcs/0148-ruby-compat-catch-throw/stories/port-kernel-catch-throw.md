---
title: "Port Kernel#catch / Kernel#throw and UncaughtThrowError into ruby-compat"
status: claimed
updated: 2026-09-14
rfc: "0148-ruby-compat-catch-throw"
cluster: fidelity
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 280
priority: 1
pr: null
claim: "2026-09-14T17:44:01Z"
assignee: "port-kernel-catch-throw"
blocked-by: null
---

## Context

RFC Design §1–§2, §4. Ruby: `vendor/ruby/vm_eval.c:2244-2391` (`rb_f_throw`,
`rb_throw_obj`, `rb_f_catch`, `rb_catch_obj`), `error.c:3216`
(`UncaughtThrowError < ArgumentError`). Specs:
`vendor/ruby/spec/ruby/core/kernel/catch_spec.rb` (14 examples),
`throw_spec.rb` (10). Precedent for file/name shape:
`packages/ruby-compat/src/kernel-float.ts` and the
`["Kernel#Float", "kernelFloat"]` row in `scripts/parity/ruby-compat.ts:54`.
The two existing per-tag copies this replaces:
`packages/activesupport/src/callbacks.ts:8-16`,
`packages/i18n/src/throw-catch.ts`. Skeleton fold table:
`scripts/api-compare/compare.ts:353`.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/kernel-catch.ts` exports `kernelCatch`,
      `kernelThrow`, `UncaughtThrowError`; ruby-compat `index.ts` re-exports.
- [ ] Tag match is `===`; uncaught throw raises `UncaughtThrowError`
      (`uncaught throw <inspect>`, `.tag`, `.value`) at the throw site, before
      any unwinding.
- [ ] The carrier is not an `Error` and not caught by `instanceof` checks.
- [ ] Blockless `kernelCatch(block)` yields a fresh object tag.
- [ ] A thenable-returning block pops the tag on settle and converts a
      matching rejection into the thrown value; a sync block stays sync.
- [ ] The active-tag chain lives in an `AsyncContext` variable; a test with two
      interleaved `kernelCatch` blocks under `Promise.all` proves a throw in
      one cannot be caught by the other.
- [ ] `catch_spec.rb` / `throw_spec.rb` ported to
      `kernel-catch.test.ts` with Ruby's test names and enrolled in
      `parity:test`; `catch_spec.rb:37,49` and the two "is a private method"
      examples are `PERMANENT-SKIP`.
- [ ] `RUBY_COMPAT_EXPORTS` gains `Kernel#catch` / `Kernel#throw` rows;
      `TS_CONSTRUCT_SKELETON_NAMES` gains `kernelThrow → throw`,
      `kernelCatch → try`. Existing rows stay until the two converge stories
      delete their names.

## Definition of done

Wrapping the carrier in an `Error`, or a module-global tag array, does not
close this story.

## Verification

`pnpm vitest run packages/ruby-compat/src/kernel-catch.test.ts`;
`pnpm parity:test` delta ≥ +21 for ruby-compat.
