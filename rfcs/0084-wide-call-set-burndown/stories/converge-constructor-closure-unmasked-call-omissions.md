---
title: "Converge the four call omissions unmasked by the constructor-closure fix"
status: draft
updated: 2026-08-14
rfc: "0084-wide-call-set-burndown"
cluster: null
packages:
  - "activesupport"
  - "actionview"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fixing the same-file-closure perturbation (RFC 0025
`extractor-missing-set-perturbed-by-unrelated-edits`) stopped the call-set
closure from walking into a same-file `constructor` that a `new X()` recorded.
That unmasked four real, pre-existing port divergences that an unrelated
constructor's call-set had been discharging. They were baselined in
`call-mismatches-exclude/` with the citations below; each row retires by
porting the call, not by the gate going quiet.

- `activesupport cache/entry.ts compressed` omits `compressed?` —
  `activesupport/lib/active_support/cache/entry.rb:77` short-circuits on the
  ported predicate; trails tests `_compressed` inline.
- `activesupport duration.ts build` omits `include?` —
  `activesupport/lib/active_support/duration.rb:206` sets `variable` via
  `VARIABLE_PARTS.include?(part)`.
- `activesupport hash-with-indifferent-access.ts merge` omits `update` —
  `activesupport/lib/active_support/hash_with_indifferent_access.rb:274` is
  `dup.update(*hashes, &block)`; trails copies entries inline.
- `actionview renderer/abstract-renderer.ts local_variable` omits `basename` —
  `actionview/lib/action_view/renderer/abstract_renderer.rb:48` uses
  `File.basename(path)`; trails splits on `/` inline.

## Acceptance criteria

- Each of the four bodies calls what Rails calls.
- The four baseline rows are deleted (only-shrink), and the resulting stale
  high-water marks tightened with `pnpm parity:api:calls:tighten`.

_Re-filed from RFC 0025 in the 2026-08-17 draft sweep: this is a convergence
story (four baselined bodies to port), not verification tooling. It was
surfaced by a 0025 extractor fix, which is why it was originally filed there._
