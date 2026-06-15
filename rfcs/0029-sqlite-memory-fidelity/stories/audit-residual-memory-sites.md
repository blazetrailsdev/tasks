---
title: "Audit residual :memory: sites (long tail + partial-audit files), spin convergence stories"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: adapter-test-fidelity
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's divergence map names the high-confidence divergences explicitly.
This audit story covers the **residual** `:memory:` sites so nothing is
silently dropped (memory: no silent caps). Three buckets:

1. **Partial-audit files** — `connection-handlers-multi-db.test.ts` (trails 13
   vs Rails 1) and `connection-handlers-sharding-db.test.ts` (trails 22 vs Rails
   6). Rails _does_ use `:memory:` here, but far fewer times. Confirm whether
   trails' excess sites mirror a Rails setup helper that establishes `:memory:`
   once (→ fidelity-correct repetition) or are genuine over-use (→ converge).
2. **Legacy adapter path** — `adapters/sqlite3-adapter.test.ts` (11) vs the
   RFC-0026 relocated `adapters/sqlite3/sqlite3-adapter.test.ts` (19). Both map
   to Rails `sqlite3_adapter_test.rb` (fidelity-correct `:memory:`). Reconcile
   the duplication with the RFC 0026 adapter-layout move; confirm no stray
   divergence in the legacy file.
3. **Long tail** (1–2 each) — `connection-handler.test.ts`, `pool-config`,
   `pool-manager`, `schema-cache`, `disconnected`, `unconnected`,
   `multiple-db`, `multi-db-migrator`, `primary-class`,
   `transaction-instrumentation`, `connection-adapters/statement-pool`,
   `type-lookup`, `quoting-interface`, `setup-adapter-suite`,
   `handler-resolved-adapter`, `with-transactional-fixtures`, and any other
   `:memory:` test site not already covered by a named story.

Explicitly out of scope (leave alone, documented fidelity-correct / trails-only
in the RFC): `sqlite-adapter.test.ts`, `sqlite/*.test.ts` driver wrappers,
`establish-connection.test.ts`, `shard-keys`, `resolver`, `adapter-args`,
`adapters/sqlite3/sqlite3-adapter.test.ts`, `adapters/sqlite3/transaction.test.ts`,
and all non-test source files.

## Acceptance criteria

- [ ] A per-file classification (fidelity-correct / divergence / trails-only)
      for every residual `:memory:` test site, each with its Rails counterpart
      cited (file + line) or an explicit "no counterpart → judged" note.
- [ ] For each confirmed divergence, a convergence story registered via
      `pnpm tasks new 0029-sqlite-memory-fidelity <slug>` (best-fit cluster),
      so it is owned and scheduled separately — this audit story does NOT itself
      change test code.
- [ ] The partial-audit count deltas (multi-db 13/1, sharding 22/6) resolved to
      a verdict with evidence (setup-helper repetition vs over-use).
- [ ] Findings appended to the RFC README divergence map (or noted in the PR)
      so the map reflects the full picture.

## Notes

This is an **analysis/authoring story** (spike-style). Closing convention:
claim-close once all per-file classifications are recorded and any convergence
stories have been spun (committed to this RFC's `stories/`). The PR itself may
contain only the new story files / divergence-map updates with **no test-code
changes** — a docs-only or closed-unmerged PR is acceptable for this spike and
is not a defect. It should be claimed early in the sweep so its spun stories
exist before agents touch the long-tail files. Do not converge code here — keep
ownership one-story-per-file.
</content>
