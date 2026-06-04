---
title: "Reconcile + delete gaps/type-audit/adapter-cleanup docs"
status: in-progress
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Three AR docs already have a home RFC but were never closed out:
`activerecord-gaps.md` → RFC 0005, `activerecord-type-audit.md` → RFC 0009,
`adapter-architecture-cleanup.md` → RFC 0010 + RFC 0007. Verify each doc's
content is fully represented in its RFC (folding any missing actionable item in
as a story), then queue the docs for deletion. See RFC 0011 §Phase 2.

## Acceptance criteria

- [ ] Every still-open item in `activerecord-gaps.md` is represented in RFC 0005
      (as a story or §Deferred entry); gaps folded in.
- [ ] Same coverage check for `activerecord-type-audit.md` vs RFC 0009.
- [ ] Same for `adapter-architecture-cleanup.md` vs RFC 0010 + RFC 0007.
- [ ] Discrepancies resolved by editing the target RFC, not the doc.
- [ ] The three docs queued for deletion in `decommission-docs`.

## Notes

These three are "reconcile + delete" in the disposition table — no new RFC,
just close the coverage gap against the existing ones.

## Coverage findings (2026-06-04)

- **`activerecord-type-audit.md` → RFC 0009: COMPLETE.** The 3 remaining waves
  (W1b, small-followups bundle, W4-deferred) map 1:1 to 0009's 3 stories;
  `small-followups-bundle` enumerates every doc "Open follow-up" component.
  Safe to queue for deletion. (One bullet — `processDependentAssociations`
  errors cast — is now moot since that fn was deleted.)
- **`adapter-architecture-cleanup.md` → RFC 0010 + 0007: covered except one.**
  PR A/B = 0010 stories; PR C ("~35-site `toSql` migration + global removal") =
  0007 `a4` (reopened — see below); `this.adapter`/`get adapter()` long-tail
  explicitly deferred in 0010 §Alternatives. **Gap: Initiative 3 — adapter
  hash-only constructor** (proposed, no code, gated on trails #2700) is not
  represented in any RFC. Fold into 0010 §Deferred (or a blocked story) before
  deleting the doc.
- **Correctness fix:** this reconcile caught that RFC 0007 was closed
  prematurely — PR C's call-site migration is incomplete (33 callers). 0007 →
  active, `a4` → ready.
- **`activerecord-gaps.md` → RFC 0005: orphans.** Its associations/
  connection-pool/relation items map to 0005 (reconciled in
  `reconcile-existing-rfcs`), and query-cache → 0004 (closed). But two sections
  have **no home in 0005's clusters**: **DatabaseTasks P3-5** (`migrateStatus`
  stdout fidelity — no DatabaseTasks-parity RFC exists) and **5 activerecord-cli
  follow-ups** (generator name validation, `ManifestResult.path` JSDoc,
  `ar console`/`runner` empty-config guard, E2E shared helpers, `ar init
--driver node-sqlite`) — these belong in **RFC 0003**. Must find homes before
  deleting the doc.

**Remaining fold-ins (each a PR-gated RFC README edit):** (1) hash-only
constructor → 0010; (2) 5 cli follow-ups → 0003; (3) a home for DatabaseTasks
P3-5. Only then queue all three docs for deletion in `decommission-docs`.
