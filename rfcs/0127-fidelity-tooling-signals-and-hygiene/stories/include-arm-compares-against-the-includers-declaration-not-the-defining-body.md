---
title: "api-compare: the include arm compares a mixin member against the includer's declaration instead of the body in its defining file"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails PR 8423 (`activemodel-converge-moves-residue`).

`scripts/api-compare/compare.ts`'s include-chain arm credits a flattened mixin
expectation through whichever includer names the method first, and runs
`checkArity` (arity, parameter names, calls, call arguments, body pins) against
that includer's member. For a host that only DECLARES the member
(`declare static modelName` on `Model`, a signature on `interface API` or
`interface AbstractAdapter`) that member is the type-level cost of `include`,
not the port. The body Rails' method corresponds to is in the file mirroring
the defining `.rb` (`naming.rb:270` in `naming.ts`), where the mixin's own
bucket already compares it.

PR 8423 added `crossFileCredit`, which separates the member a move row names
(`move`) from the member the pair is compared against (`compared`), and left
`compared` on the includer so no population moved. Routing these pairs to the
mixin arm instead (compare nothing on the host, as
`mixinMethodCreditedToOwnFile` already does when no includer names the method)
was measured on that branch:

- `parity:api:pins` reports 90 STALE pins (actioncontroller
  `metal/data_streaming.rb`, actiondispatch `testing/assertions.rb`, and more).
- arity denominators fall: activerecord 3784 to 3773, activemodel 447 to 440,
  actiondispatch 1021 to 1006, actioncontroller 408 to 398, actionview 669 to 534.
- parameter-name pairs fall 6628 to 6481; `parity:api:calls` goes red.

So the host-side comparison is a second measurement of pairs the mixin's own
bucket already owns, against a declaration rather than a body.

## Acceptance criteria

- [ ] `crossFileCredit` returns `compared: null` for an `"include"` credit whose `move` is `inDefiningFile`, so the pair is compared once, in the defining file's bucket.
- [ ] The stale body pins are pruned with `body-pins.ts --prune`, and any call / call-args baseline row made stale is deleted by hand, with each deleted row checked to still be gated in the defining file's bucket.
- [ ] The PR body re-reports the arity, params and pins denominators per package before and after.
- [ ] No matched-method total changes in any package.
