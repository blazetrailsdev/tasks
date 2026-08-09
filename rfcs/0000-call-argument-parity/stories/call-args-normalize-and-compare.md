---
title: "call-args.ts normalizes and compares Ruby/TS call arguments"
status: draft
updated: 2026-08-09
rfc: "0000-call-argument-parity"
cluster: api-compare
packages: []
deps: ["ruby-extractor-emit-call-arguments", "ts-extractor-emit-call-arguments"]
deps-rfc: []
est-loc: 230
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The comparison half of the RFC 0025 `## Call-argument fidelity` spike
(2026-08-08). Depends on both extractor stories. New module
`scripts/api-compare/call-args.ts`, sitting beside its prior art:
`literals.ts` (matches params by name, snake_case → camelCase,
`compareDefaults` at `literals.ts:105`) and `options-keys.ts`
(`normalizeRubyKey`, `options-keys.ts:24`).

The exact rules are written up in the RFC's §2 and are not to be re-derived.
Summary:

- Normalize via `snakeToCamel` from `@blazetrails/parity/conventions`:
  identifiers, nested call names, Ruby `new` → `constructor`.
- Symbols → the JS string spelling, and the colon-kept spelling (`":dump"`,
  CLAUDE.md "Symbols vs strings") must compare **equal** to the bare one.
- Identifier-shaped strings (`/^[a-z][A-Za-z0-9_]*$/`) camelize; anything else
  (SQL fragments like `" GROUP BY "`) compares byte-for-byte. This is load-
  bearing: byte-comparing SQL fragments is what surfaces the argument-order
  finding, and camelizing them would destroy it.
- `id:` and `call:` collapse into one `ref:` bucket — Ripper cannot distinguish
  a local read from a zero-arg self-send.
- Literal values reuse `literals.ts` `normalizeLiteral`.

Skip (no cross-language agreement): splat / double-splat / block-pass on either
side; any argument list containing an opaque descriptor **including one nested
inside a `kwargs{}`** — the spike measured that leak as 8 of 17 noise rows and
94 of 604 total rows on activerecord; `super`; every `NO_JS_CALL_FORM` name
(`compare.ts:195`) and the Enumerable/Object idiom denylist; and a leading
`this`-mixin receiver argument the port adds (`deleteThroughRecords(this,
records)` for Rails `delete_through_records(records)`).

Rows must be emitted classified as `shape` (count / order / literal / kwarg
key) or `naming` (lists differing only in a `ref:` spelling) — the RFC's §4
gates the first and reports the second.

## Acceptance criteria

1. `call-args.ts` exports the normalizer and a verdict function
   (`match` / `mismatch` / `skip`), mirroring `literals.ts`'s
   `compareLiteral` shape.
2. Every rule and every exclusion in the RFC §2 has a test in
   `call-args.test.ts`, including the nested-`?` skip and the mixin-receiver
   rule.
3. Rows carry a `class` of `"shape"` or `"naming"`.
4. Re-running the spike's population over `arel` reproduces the recorded
   figures within a small delta: 302 comparable sites, ~70 flagged.
