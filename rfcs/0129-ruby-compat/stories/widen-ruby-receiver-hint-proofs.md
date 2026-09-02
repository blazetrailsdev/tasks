---
title: "widen-ruby-receiver-hint-proofs"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 64
pr: 7383
claim: "2026-09-02T11:42:52Z"
assignee: "port-lazy-attribute-hash-delegate-to-a-record"
blocked-by: null
closed-reason: null
---

## Context

`record-ruby-call-receiver-hints` (PR #7334) landed `callReceivers` on
`extract-ruby-api.rb` and the receiver-keyed half of the ruby-compat table. Its
review traced two narrow gaps in what the extractor can prove, both deliberate
in that PR's scope:

- **An implicit-self site blocks a proven-hash name.** `call_receiver_kinds`
  (`scripts/api-compare/extract-ruby-api.rb`) keeps `self` beside the other
  kinds, and `rubyCompatExport` (`scripts/parity/ruby-compat.ts`) admits a
  receiver-keyed row only when EVERY kind equals the row's own. So a Hash
  `core_ext` body that calls `options.fetch(:x)` and a bare `fetch(:y)` on
  itself credits neither, though inside `active_support/core_ext/hash/**` the
  implicit self IS a Hash — the same `core_ext_file?` fact `core_receiver_call?`
  already reads (`extract-ruby-api.rb`).
- **A keyword param with a hash default is not proven.** `hash_param_names`
  recognises `**opts` and an optional POSITIONAL `options = {}`; a
  `def foo(b: {})` keyword default is the same evidence and is not read.

Neither is a false credit — both under-approximate, which is the safe
direction — so this is coverage, not correctness.

## Acceptance criteria

- A `core_ext` body whose file reopens `Hash` records `hash`, not `self`, for an
  unqualified call site, keyed on the same `core_ext_file?` the weak-call
  verdict uses; a `core_ext` file for another class is unaffected.
- `hash_param_names` reads a keyword parameter whose default is a hash literal.
- Both arms are covered in the `call receiver kinds` describe of
  `scripts/api-compare/extract-ruby-api.test.ts`.
- `parity:api:calls` and `parity:api:calls:args` unchanged; the reverse
  population of `parity:api:calls:ruby-compat:report` reported before/after.
