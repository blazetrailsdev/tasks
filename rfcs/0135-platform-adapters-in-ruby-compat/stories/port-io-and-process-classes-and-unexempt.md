---
title: "IO and Process port, flip and leave CORE_CLASS_RECEIVERS in one story — the shape reserved for a receiver that fits one PR"
status: draft
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["narrow-ruby-compat-leaf-guard-to-static-imports"]
deps-rfc: []
est-loc: 320
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IO` (50 Rails calls) and `Process` (109) are small enough to port, flip and
unexempt in a single PR — the shape RFC 0135 reserves for a receiver whose call
sites fit one story. Contrast `File`/`Dir`, which need a five-link flip chain
before their exemption can move.

`Process` is the Ruby surface over `packages/activesupport/src/process-adapter.ts`
(393 LOC), whose members are already close to Ruby's: `cwd()` at `:103` is
`Dir.pwd`, `platform()` at `:111` is `RUBY_PLATFORM`. Note `process-adapter.ts`
is the one adapter with **no Node bootstrap** (no `getBuiltinModule` /
`createRequire` call in the file), so it is the cheapest of the seven to
relocate and carries none of the leaf-guard risk.

`IO` overlaps `StringIO`, already in ruby-compat
(`packages/ruby-compat/src/string-io.ts`) with a `@noRailsEquivalent PERMANENT`
receipt citing `vendor/ruby/ext/stringio/stringio.c:1432`. Port `IO` as the
parent surface `StringIO` is written against rather than a second, parallel
thing — check what `string-io.ts` already implements before adding a member.

Both receivers leave `CORE_CLASS_RECEIVERS`
(`scripts/api-compare/extract-ruby-api.rb:3008-3011`) in this story, and the
gate is green when it lands or the story does not land.

## Acceptance criteria

- `IO` and `Process` exist in `ruby-compat` with MRI citations and
  `@noRailsEquivalent PERMANENT` receipts; `process-adapter.ts` has moved and
  left no shim.
- `StringIO` is expressed in terms of `IO` where the two overlap, not beside it.
- `IO` and `Process` are gone from `CORE_CLASS_RECEIVERS` and both call gates
  are green.
- `Dir.pwd` is the seat for `cwd()` and `RUBY_PLATFORM` for `platform()`, with
  their 125 and 18 call sites flipped.
