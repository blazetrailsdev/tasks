---
title: "aggregations-reload-hardcodes-persistence-skips-autosave-mro"
status: done
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4527
claim: "2026-07-04T00:31:09Z"
assignee: "aggregations-reload-hardcodes-persistence-skips-autosave-mro"
blocked-by: null
closed-reason: null
---

## Context

trails' `Aggregations#reload` (aggregations.ts:227-238) hardcodes a call
straight to `persistenceReload` (Persistence#reload). In Rails' real MRO the
reload chain is `Aggregations → AutosaveAssociation → Persistence`
(base.rb:300 includes AutosaveAssociation, base.rb:319 includes Persistence;
AutosaveAssociation#reload at autosave_association.rb:238 resets loaded
association targets before delegating to super/Persistence#reload).

trails has NO `AutosaveAssociation#reload` override today, so nothing is
currently skipped — the hardcoded 2-hop is behaviorally equivalent right now.
This is a latent ancestry gap, not an active regression. Surfaced in review of
PR #4525 (aggregations-unconditional-include-vs-lazy-composed-of).

## Acceptance criteria

- [ ] When/if trails ports `AutosaveAssociation#reload` (reset in-memory
      association targets on reload), the aggregations reload wrapper must
      delegate through the real ancestry (inherited `reload`) rather than
      hardcoding `persistenceReload`, so the autosave hop is not skipped.
- [ ] Prefer capturing the inherited `reload` at includeAggregations time
      (Ruby `super`) over a direct persistenceReload import, matching the
      already inheritance-aware initializeDup wiring.
- [ ] No regression to composed_of reload cache-clearing.
