---
title: "parity:api:key-reads keys a body by owner and splits the receiver-unread bucket"
status: done
updated: 2026-10-14
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8905
claim: "2026-10-14T15:30:10Z"
assignee: "key-read-report-key-unread-rows-converge"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:key-reads` (trails#8855) keys a body by file and bare name on
both sides. `scripts/api-compare/extract-key-reads.rb` (`walk`) pools every
`def` of one name in a file (`def call` in two classes, `def self.x` beside
`def x`), and `report-key-reads.ts#tsKeyReads` pools every TS function of one
name in a file and counts a nested function's reads for its enclosing body as
well. The pooling can only credit a read, so `matched` is an upper bound (the
86% at merge is optimistic) and a real dropped read in one of two same-named
bodies is hidden. At merge the report also counted 108 `receiver-unread`
pairs, shown only under `--all`, with no rule telling a renamed local or a
destructured parameter from a dropped read.

## Acceptance criteria

- [ ] The Ruby half keys reads by enclosing class/module and singleton-ness,
      the TS half by enclosing class and `static`, and the join uses the
      owner the skeleton row's pair carries.
- [ ] A TS body's reads stop at a nested named function that is itself a
      compared pair.
- [ ] The `receiver-unread` bucket is split: a Ruby receiver that is a
      parameter the port destructures in its signature is credited by the
      destructured names; what remains is listed by default.
- [ ] `report-key-reads.test.ts` pins each rule. The report stays report-only:
      no gate, no baseline.
