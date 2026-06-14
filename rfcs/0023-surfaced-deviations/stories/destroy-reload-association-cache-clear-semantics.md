---
title: "destroy/reload association-cache clear diverges from Rails (clear+repopulate vs freeze/wholesale-replace)"
status: ready
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during review of PR #3194 (`b5-converge-association-cache`). Both are
**pre-existing** divergences, not introduced by that PR — it only consolidated
the existing clears behind `Base#_resetAssociationCaches`.

1. **destroy** — Rails `destroy` does not clear `@association_cache`; it just
   `freeze`s the record (`activerecord/lib/active_record/persistence.rb:459`).
   The TS `destroy` path clears all three association maps after `freeze`.
2. **reload** — Rails `reload` replaces `@association_cache` wholesale from the
   freshly-fetched object (`persistence.rb:751`). The TS `reload` clears the
   maps and then re-populates `_preloadedAssociations` from a strict-load
   refetch, rather than swapping in the fresh object's cache.

Decide for each whether to match Rails or keep the Trails behavior as an
intentional, documented deviation. Likely low-risk; verify no test relies on
the divergent post-destroy / post-reload cache state before changing.

## Acceptance criteria

- [ ] destroy: either drop the post-freeze map clear to match Rails, or record
      the divergence with rationale.
- [ ] reload: either adopt wholesale-replace-from-fresh, or record the
      divergence with rationale.
- [ ] No test renames; `api:compare`/`test:compare` delta non-negative.
