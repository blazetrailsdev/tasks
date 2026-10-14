---
title: "inlined-chain-with-own-and-same-file-initialize-is-skipped-as-ambiguous"
status: done
updated: 2026-10-14
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8890
claim: "2026-10-14T11:12:27Z"
assignee: "inlined-chain-with-own-and-same-file-initialize-is-skipped-as-ambiguous"
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8796 (`scripts/api-compare/compare-inlined-from.test.ts`).

`checkCalls` in `scripts/api-compare/compare.ts` builds the inlined chain with `inlinedSegmentsFor` and then returns at `if (ambiguous) return;` before comparing anything. `resolveOwner` answers `ambiguous` through `ambiguousRubyOwner` whenever two Ruby owners in one `.rb` define the name on the seat the TS owner holds.

A Rails class that defines `initialize` AND includes (or prepends) a module from its own file that also defines `initialize` is exactly that shape: the class and the module are two Ruby owners of `initialize` in one file. So the pair RFC 0188 exists to compare, own body plus same-file module body against one constructor, is skipped by the call-set gate and by `checkCallArgs`. The chain is built (a stale or redundant `@inlinedFrom` tag still throws), and then nothing is compared and nothing reports the skip.

Reproduction: in `compare-inlined-from.test.ts`, add `"Local"` to `ActiveModel::Thing`'s includes with the `ActiveModel::Thing::Local` module present, and omit `assignAttributes` from the constructor's calls. No `assign_attributes` row is written. Without the same-file module the row appears.

A same-file module with no `initialize` on the class itself (`I18n::Backend::Chain` with `Implementation`, `vendor/i18n/v1.14.8/lib/i18n/backend/chain.rb:27-29`) has one owner and is compared.

## Acceptance criteria

- A constructor paired with a Rails `initialize` whose chain has two or more segments is compared against the union even when the segments' owners make the name ambiguous in that file: the chain is the disambiguation.
- The end-to-end test in `compare-inlined-from.test.ts` gains the case above and flags the omitted call.
- `parity:api:calls` and `parity:api:calls:args` stay green, or each new row is named and converged.
