---
title: "Pair a Ruby name= writer with the TS set accessor, not its same-named reader"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6702
claim: "2026-08-18T14:29:41Z"
assignee: "pair-ruby-writer-with-ts-set-accessor-not-its-reader"
blocked-by: null
closed-reason: null
---

## Context

Ruby's reader/writer pairs (`formats` / `formats=`, `variant` / `variant=`) both
translate to the TS name `formats` / `variant` — a plain module function for the
reader and a `set` accessor on the module class for the writer. The call
comparator pairs by that name, so the WRITER's calls get compared against the
READER's Ruby body (and vice versa), producing shape rows no port change can
converge.

Two live instances, both now baselined in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/http/mime-negotiation.json`
(#6697):

- `rubyName: formats`, `call: set_header`, ruby `["ref:k", "ref:v"]` vs ts
  `["str:action_dispatch.request.formats", "ref:map"]`. Ruby's reader ends in
  `set_header k, v` (`actionpack/lib/action_dispatch/http/mime_negotiation.rb:85`);
  the TS side the comparator reads is `set formats`, mirroring
  `mime_negotiation.rb:137`'s
  `set_header "action_dispatch.request.formats", extensions.collect { … }`.
  The reader function in
  `packages/actionpack/src/action-dispatch/http/mime-negotiation.ts` already
  forwards `(k, v)` verbatim — it is simply not the member being compared.
- `rubyName: variant`, `call: new`, ruby `[]` vs ts
  `["str:request.variant must be set to a Symbol or an Array of Symbols."]`.
  Ruby's `variant` reader (`mime_negotiation.rb:100`) constructs
  `ArrayInquirer.new` with no arguments; the TS `set variant` builds the error
  `variant=` raises at `mime_negotiation.rb:96`.

`precise-call-pairing-key-for-owner-static-and-accessor` (done) sharpened the
pairing key for owner/static/accessor but did not separate a Ruby `name=` writer
from its same-named reader, which is what these two rows need.

## Acceptance criteria

- [ ] The call and call-argument comparators pair a Ruby `name=` writer with the
      TS `set name` accessor, and the Ruby `name` reader with the TS member that
      ports it — never crosswise.
- [ ] Pinned in `call-args.test.ts` (and `call-mismatches` coverage if the
      call-SET side is affected too).
- [ ] Both rows above are deleted from
      `call-mismatches-exclude/actiondispatch/http/mime-negotiation.json`, with
      `pnpm parity:api:calls:tighten` for any stale mark.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
