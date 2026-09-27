---
title: "Simulator#memos hand-drives a regexp where Rails scans with StringScanner (last Journey call row)"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 80
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The only Journey row left in the call-set baseline is
`scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/gtg/simulator.json`:
`memos` misses `new`. The Ruby is `input = StringScanner.new(string)`
(`vendor/rails/actionpack/lib/action_dispatch/journey/gtg/simulator.rb`,
`Simulator#memos`). The row's reason points at RFC 0156's
`converge-same-name-second-owner-call-rows`, but that story is about the gate
mechanism. The divergence itself is real: trails' `Simulator#memos`
(`packages/actionpack/src/action-dispatch/journey/gtg/simulator.ts`) drives a
sticky module-level `TOKEN` regexp by hand instead of a `StringScanner`.

The same method is also one of the four Journey rows in
`pnpm tsx scripts/api-compare/report-arms.ts --sample=500 --package=actiondispatch --direction=missing`
(`journey/gtg/simulator.ts#memos  count  -loop`). It is not in
`journey-arm-and-short-circuit-triage`'s verdict list, because it surfaced after
that story closed. The Ruby builds `acceptance_states` with `each_with_object`
and returns `acceptance_states.empty? ? yield : acceptance_states`.

No `StringScanner` is exported from `ruby-compat` today. `activesupport` has two
private copies, which RFC 0023's
`activesupport-has-two-private-stringscanner-copies` would consolidate.

## Acceptance criteria

- `Simulator#memos` scans with a `StringScanner` (the shared ruby-compat one if
  it has landed; otherwise record why not in the body) and builds the
  acceptance list in `each_with_object` shape.
- `call-mismatches-exclude/actiondispatch/journey/` is empty, meeting RFC 0139's
  Verification bullet, and `pnpm parity:api:calls` is green.
- The `-loop` arm row on `simulator.ts#memos` is gone, or has a written verdict
  with the Rails `file:line`, in the PR body.
- `journey/gtg/*` tests stay green.
