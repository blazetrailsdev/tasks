---
title: "extract-ruby-api.rb emits per-call-site argument descriptors"
status: done
updated: 2026-08-09
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6298
claim: "2026-08-09T20:49:50Z"
assignee: "call-args-artifact-and-report"
blocked-by: null
closed-reason: null
---

## Context

The RFC 0025 `## Call-argument fidelity` spike (2026-08-08) established that
`walk_for_calls` (`scripts/api-compare/extract-ruby-api.rb:2291`) can emit each
call's argument list at useful fidelity. It currently visits every
`:fcall` / `:vcall` / `:call` / `:command` / `:command_call` / `:super` node and
discards everything but the name. The argument node is a sibling already in
hand: `node[2]` for `:command` and `:method_add_arg`, `node[4]` for
`:command_call`, `node[1]` for `:super`.

Emit a parallel `callArgs` stream alongside the existing `calls` /
`weakCalls` (`collect_method_calls`, `extract-ruby-api.rb:2039-2047`), one
entry per syntactic call site, in source order, with the descriptor grammar the
spike settled (see the RFC's §1 table):

- `id:<name>` bare identifier/ivar, `num:` / `str:` / `bool:` / `nil` literals,
  `sym:<name>`, `const:<short>`, `call:<name>` nested call (name only),
  `kwargs{k=<desc>,…}`, `call:constructor` for `Foo.new`.
- Opaque, must be emitted as-is so the comparator can skip them: `?`, `array`,
  `hash`, `str-interp`, `binop:<op>`, `unary<desc>`, `ternary`.
- Per-site flags: `splat`, `blockpass`, `block`, `zsuper`.

Each syntactic call site must be recorded exactly **once**: a `:method_add_arg`
wrapping a `:fcall` re-walks the inner node, and the naive traversal double-
records it. The spike used a consumed-node set keyed on the callee node.

Note the two structural Ripper limits the RFC records: a local read and a
zero-arg self-send are indistinguishable (so `id:` / `call:` collapse in the
_comparator_, not here), and local aliasing is invisible.

## Acceptance criteria

1. `extract-ruby-api.rb` emits `callArgs` per method: ordered, one entry per
   syntactic call site, `{ name, args: string[], flags: string[] }`.
2. Every descriptor form in the RFC §1 table is covered by a test in
   `extract-ruby-api.test.ts`, including nested `kwargs{}`, splat, block-pass
   and `Foo.new`.
3. No call site is double-recorded; a test pins `foo(bar(1))` to exactly two
   sites.
4. **No `extractor-schema.ts` change.** That file governs the **TS** extractor
   cache only (`EXTRACTOR_SOURCES` is `["extract-ts-api.ts",
"extract-ts-api-worker.mjs"]`, `extractor-schema.ts:91`). The Ruby manifest's
   shared-cache key is the content hash of `extract-ruby-api.rb` itself
   (`RAILS_INPUTS` / `railsCacheKey`, `orchestrate.ts:88-99`), so editing the
   extractor self-invalidates and a stale cache cannot serve argument-less
   records. Registering `callArgs` belongs in the TS story; do not duplicate it
   here.
5. `pnpm parity:api` output and the existing `calls` / `weakCalls` streams are
   byte-identical to before (additive change only).
