---
title: "Measure, then report, a dropped Hash#[] read: no call gate sees an element access on either side"
status: in-progress
updated: 2026-10-13
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8855
claim: "2026-10-13T13:13:45Z"
assignee: "hash-aref-read-is-invisible-to-every-call-gate"
blocked-by: null
closed-reason: null
---

## Context

`native-hash-element-access-credits-aref-aset` (trails#8775) measured what the
gates do with a Hash `[]` / `[]=`, and found that none of them sees it at all.

- Ruby `h[k]` is an `:aref` node, not a call. `walk_call_in_order`
  (`scripts/api-compare/extract-ruby-api.rb`) records only names matching
  `/\A[a-z]/`, so `[]` never enters `calls`, `callReceivers` or the order
  stream.
- As an argument it describes as `?` (`describe_arg`, the `else` arm), which
  takes the whole call site out of `parity:api:calls:args`.
- The only trace is the skeleton token `ref:get`
  (`extract-ruby-api.rb`, the `kind == :aref` arm of `walk_for_skeleton`; TS
  twin `extract-ts-api.ts#extractSkeleton`, `ElementAccessExpression`), and no
  gate compares `ref:` tokens.

So a port that drops an option read (`options[:only_path]`) is green on every
call gate, with or without `hashAref`. The RFC's substitution stories remove
`hashAref` / `hashAset` on the strength of "no gate tells them apart", which is
true, but the underlying blind spot is wider than the helpers. The tests added
in trails#8775 ("native element access as the port of Hash#[] / Hash#[]=",
`scripts/api-compare/extract-ts-api.test.ts`) pin today's behaviour, including
the negative case.

## Acceptance criteria

- [ ] Measure first: for every matched pair, count Ruby `ref:get` tokens whose
      receiver is a named local / ivar / reader against TS `ref:get`,
      `ref:hashAref` and property reads of a Symbol-key name on the same
      receiver. Put the per-package table in the PR body. If the mismatch
      population is dominated by faithful ports the comparer cannot pair,
      close this story `FALSIFIED:` with the table rather than building a gate.
- [ ] If the population is tractable, add a report-only dimension (no gate, no
      baseline) listing bodies where Rails reads a literal Symbol key off a
      named receiver and the port reads no such key off that receiver.
- [ ] `h.k`, `h["k"]`, `h[k]` and `hashAref(h, k)` all count as the read.
- [ ] No existing gate changes verdict, and no baseline row is added.
