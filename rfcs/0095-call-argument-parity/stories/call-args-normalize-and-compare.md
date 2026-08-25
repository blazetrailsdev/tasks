---
title: "call-args.ts normalizes and compares Ruby/TS call arguments"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: ["ruby-extractor-emit-call-arguments", "ts-extractor-emit-call-arguments"]
deps-rfc: []
est-loc: 230
priority: null
pr: 6309
claim: "2026-08-10T00:02:19Z"
assignee: "call-args-normalize-and-compare"
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
4. ~~Re-running the spike's population over `arel` reproduces the recorded
   figures within a small delta: 302 comparable sites, ~70 flagged.~~
   **Superseded 2026-08-10 (PR #6309) — mis-specified, and structurally
   unmeetable by this story.** The 302 / ~70 figures were produced by the
   spike's own throwaway Ripper and `typescript` walkers; RFC 0095's Provenance
   records that no trails code was written for it. The shipped descriptor
   streams come from different code —
   `extract-ruby-api.rb#describe_args` and `extract-ts-api.ts#describeArgs`,
   landed by the two extractor stories — so the site population is not the one
   the spike counted, and no choice inside `call-args.ts` can recover it.
   Measured over arel in #6309 under four candidate site-pairing policies:
   115 / 217 / 213 / 389 comparable and 12 / 50 / 53 / 98 flagged. The spread is
   the PAIRING policy, which is `call-args-artifact-and-report`'s AC, not this
   story's.

   What this story is accountable for — the comparator — does reproduce: the
   strict-index match RATE is 76.9% against the spike's recorded 76.8%, and
   every finding the RFC names is present (the `collect_nodes_for` /
   `inject_join` / `infix_value` / `grouping_parentheses` rows with `collector`
   moved last, `build_quoted`'s swapped pair, the `dot.rb` `visit_edge` label
   drift).

   Replaced by: verify the comparator against `arel` by those two checkable
   properties (match rate within a point of 76.8%, and the named a1/a3 findings
   all flagged). The absolute population is re-measured against the SHIPPED
   pairing, and the RFC's "Measured signal" table corrected, by
   `call-args-arel-population-recheck`.
