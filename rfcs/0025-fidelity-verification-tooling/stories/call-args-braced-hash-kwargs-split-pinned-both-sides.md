---
title: "pin the keyword-shaped-hash vs opaque-hash split across both call-arg extractors"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
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
closed-reason: "Superseded by complete-call-arg-descriptor-grammar-both-sides (2026-08-17 sweep): merged with call-args-descriptor-grammar-aref-regexp-forward. Citations carried forward."
---

## Context

`extract-ruby-api.rb` (#6298) resolves a braced Ruby hash argument in one of two
ways, and the TS extractor must resolve an object literal the same way or the
argument dimension seeds a systematic false-positive class on every such site:

- a `:hash` whose assocs are **all keyword-shaped** (`k:` or `:k =>`) →
  `kwargs{k=<desc>,…}` (`describe_hash` / `describe_kwargs`);
- string-keyed, dynamic-keyed and **empty** hashes → the opaque `hash`
  descriptor.

This split is not stated in RFC 0025 §1, whose table has two rows that both
claim `foo({ a: 1 })` — "keyword args / trailing hash" (`kwargs{}`) and "array /
hash literal contents" (opaque `hash`). #6298 broke the tie toward the TS side,
because `ts-extractor-emit-call-arguments` specifies `ObjectLiteralExpression` →
`kwargs{…}`; emitting `hash` on the Ruby side would have made every braced-hash
argument a guaranteed mismatch.

`ts-extractor-emit-call-arguments` AC4 pins the two extractors' descriptor
**vocabulary**, but not this **semantic**: a TS side that renders `{}` or
`{ [k]: v }` as `kwargs{}` where Ruby renders `hash` passes the vocabulary pin
and still mismatches on every site. It needs its own pin.

Measured at merge time over activerecord + activesupport + activemodel +
actionpack: 697 `kwargs{…}` descriptors against 70 surviving opaque `hash`, all
of the latter genuinely empty (`each_with_object({})`) or non-keyword.

## Acceptance criteria

1. The keyword-shaped/opaque split is written into RFC 0025 §1 as the tie-break
   between its two competing rows, with the reasoning (TS `ObjectLiteralExpression`).
2. The TS extractor applies the same rule: an object literal whose properties
   are all plain identifier or string-literal-identifier keys →
   `kwargs{…}`; a computed key, a spread-only literal, or an empty literal →
   `hash`.
3. A shared test pins the split from both sides on the same five spellings
   already covered by the Ruby test "reads a braced hash with keyword-shaped
   keys as kwargs, and any other as opaque": `{a: 1}`, `:b => 2` / `{b: 2}`,
   `{}`, `{"c" => 3}`, `{[x]: 4}`.
