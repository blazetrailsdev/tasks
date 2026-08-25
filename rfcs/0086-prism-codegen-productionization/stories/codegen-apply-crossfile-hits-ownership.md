---
title: "Thread the port-ownership index through crossFileHits / codegen:apply"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #5833 added `PortOwnership` (`scripts/prism-codegen/score.ts`): a Rails
`def`-name → twin-port-path index that stops `resolvePortFn`'s cross-file
fallback borrowing a symbol another Rails file's twin owns. `resolvePortFn`
takes the index; `crossFileHits` does not.

`crossFileHits` is the ambiguity half of the same rule — `codegen:apply` uses
it (`scripts/prism-codegen/apply.ts:117`) to refuse scaffolding when a def
plausibly already exists elsewhere in the port. It was deliberately left
unfiltered in #5833 so the refusal stayed conservative, but the consequence is
that `apply` can refuse on a hit ownership already proves is a different Rails
class' method — e.g. `SchemaCache#initializeDup` blocking a scaffold for
`associations.rb`'s.

Also note `apply.ts:76` / `apply.ts:109` call `resolvePortFn` without
`globalIndex` at all, so the two call sites disagree about how much of the
resolution rule they apply.

## Acceptance criteria

- `crossFileHits` accepts the ownership index and excludes hits another Rails
  file's twin owns, or the divergence from `resolvePortFn` is documented at the
  call site with why the refusal must stay broader.
- `apply.ts`'s `resolvePortFn` and `crossFileHits` call sites agree on which
  parts of the resolution rule they pass.
- A test pins that `apply` no longer refuses on an ownership-excluded hit.
