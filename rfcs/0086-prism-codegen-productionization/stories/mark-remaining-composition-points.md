---
title: "Mark the port's remaining realized super chains for the MRO check"
status: ready
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5830 landed the composition-point ↔ MRO check
(`scripts/prism-codegen/composition.ts`), but only ONE chain currently carries
`prism-mro:` markers: `initialize_internals_callback`, at the two constructor
branches in `packages/activerecord/src/base.ts`. Other realized `super` chains
in the port are still unchecked and can drift exactly as that one had.

The clearest next one is `init_internals`: Rails defines it in `core.rb`
(`def init_internals`) and again in `associations.rb`, whose body supers into
Core's — PR #5817's description cites the generated
`Persistence.initInternals.call(this, ...)` for precisely this chain. The port
realizes it as `_Core.initInternals.call(this as any)` in both constructor
branches of `base.ts`, with the association half wired separately.

Sweep the ancestry for other multi-definer instance methods the port realizes
at a composition point and mark them, so the check covers more than one chain.

## Acceptance criteria

- `init_internals` carries a `prism-mro:` marker at each composition point that
  realizes it, and `pnpm codegen:score` passes (or the drift it exposes is
  converged, mirroring how #5830 handled the STI-vs-scope order).
- At least one further multi-definer chain is surveyed; any that turn out NOT
  to be realized as an explicit composition point are recorded in the story
  outcome rather than marked.
- No new markers for chains the port does not actually compose — a marker with
  a bogus binding fails the check for the wrong reason.
