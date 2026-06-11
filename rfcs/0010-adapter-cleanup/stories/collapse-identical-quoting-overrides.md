---
title: "Collapse abstract-identical quoting overrides to inherit from the base"
status: done
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
pr: 3133
claim: "2026-06-11T20:54:05Z"
assignee: "collapse-identical-quoting-overrides"
blocked-by: null
priority: 6
---

## Context

From the `drop-legacy-crutches` audit (Q5) — **optional polish, lowest
priority.** The four `connection-adapters/*/quoting.ts` modules independently
re-declare the same 10 functions (`quote`, `quoteString`, `quoteIdentifier`,
`quoteTableName`, `quoteColumnName`, `quotedTrue`, `quotedFalse`, `typeCast`,
`columnNameMatcher`, `columnNameWithOrderMatcher`), 1,579 LOC total. Much of that
is **legitimately dialect-specific** (MySQL backtick vs. double-quote, PG
`E'...'` escapes, SQLite bool `1`/`0`) and MUST stay.

This story only collapses the cases where a concrete adapter's override is
**byte-identical** to the abstract implementation (it adds nothing), so the
override + its freestanding copy can be deleted and the behavior inherited from
`AbstractAdapter`. Candidate: `columnNameMatcher` / `columnNameWithOrderMatcher`
where the dialect adds no COLLATE/quoting difference. For each function: diff the
concrete body against the abstract one; only remove when provably identical for
that dialect (don't assume — e.g. PG's matchers DO add COLLATE, so PG keeps its
own).

This is the lowest-value of the quoting-convergence stories; the per-adapter
dispatch stories (Q1–Q3) and the sanitization story (Q4) should land first since
they remove actual cross-module call-site crutches. Hold this as backlog.

Out of scope: any genuinely dialect-specific copy; the dispatch-conversion
stories. Not RFC 0019.

## Acceptance criteria

- [ ] Only byte-identical-to-abstract overrides are removed; every
      dialect-specific copy is left intact (justify each removal with a diff)
- [ ] Removed overrides correctly inherit from `AbstractAdapter`
- [ ] No behavior change on any adapter; full quoting test parity
- [ ] `api:compare` delta non-negative
