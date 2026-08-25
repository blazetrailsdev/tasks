---
title: "extract-ts-api.ts emits per-call-site argument descriptors"
status: done
updated: 2026-08-09
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 170
priority: null
pr: 6304
claim: "2026-08-09T22:56:32Z"
assignee: "ts-extractor-emit-call-arguments"
blocked-by: null
closed-reason: null
---

## Context

Counterpart to `ruby-extractor-emit-call-arguments`. Per the RFC 0025
`## Call-argument fidelity` spike (2026-08-08), `collectCalls`
(`scripts/api-compare/extract-ts-api.ts:2698`) already walks `CallExpression`,
`NewExpression` and `PropertyAccessExpression` and does
`call.arguments.forEach(visit)` — the argument nodes are on the node. Emit a
`callArgs` stream mirroring the Ruby one, using the same descriptor grammar.

The one subtlety the spike found: `collectCalls` deliberately credits a bare
property **read** (`this.joinsValues`) as a call, because Ruby has no field
access. Those are not call sites and carry no argument list. `callArgs` must
record syntactic call sites only, so the comparator can tell "the TS body has
no comparable site for this name" apart from "the TS body calls it with zero
arguments" — conflating them manufactures false rows.

Mappings the spike verified: `ObjectLiteralExpression` → `kwargs{…}`
(shorthand properties included), `SpreadElement` → `*splat` + the `splat` flag,
arrow/function expression argument → the `block` flag, `NewExpression` →
`call:constructor` (matching the Ruby `new` → `constructor` mapping already in
`collectCalls`), `await`/`as`/`!`/parenthesized wrappers unwrap to the inner
expression.

## Acceptance criteria

1. `extract-ts-api.ts` emits `callArgs` per method/function/accessor:
   ordered, one entry per syntactic call site,
   `{ name, args: string[], flags: string[] }`.
2. Property reads produce **no** `callArgs` entry; a test pins that
   `this.foo` and `this.foo()` differ in the stream.
3. Descriptor coverage matches the Ruby side one-for-one — the RFC §1 table is
   the checklist — with tests in `extract-ts-api.test.ts`.
4. `extractor-skew.ts` (or its test) pins that the two extractors agree on the
   descriptor vocabulary, so the streams cannot drift apart silently.
5. `callArgs` is registered in `EXTRACTOR_OUTPUT_FIELDS`
   (`extractor-schema.ts:46-58`) so the schema token changes and cache entries
   predating the field are evicted. This is the **only** story that touches
   `extractor-schema.ts` — the Ruby extractor's cache keys on its own source
   content instead (`orchestrate.ts:88-99`) and needs no registration, so the
   two extractor stories stay parallel-safe with no shared edit.
6. Additive: the existing `calls` stream is unchanged.
