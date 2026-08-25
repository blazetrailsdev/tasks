---
title: "Scope isPortedWithArgs to the same package instead of package+deps"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: ["ruby-extractor-record-call-receiver-kind"]
deps-rfc: []
est-loc: 120
priority: 0
pr: 5855
claim: "2026-08-02T02:16:58Z"
assignee: "scope-ported-with-args-to-package"
blocked-by: null
closed-reason: null
---

## Context

Gate 2 of `significantMissingCalls` — `if (!mapped.some(isPortedWithArgs))
continue` (`compare.ts:272`) — is meant to skip Ruby calls whose TS counterpart
is a zero-arg reader. But the predicate closes over `tsParamsByName`, which is
built package + dependency wide (`compare.ts:1657-1659`). One same-named method
taking a parameter anywhere in the package or its deps satisfies the gate for
every file.

This is the mechanism behind "porting one widely-called method trips N baseline
entries at once", and it is why arel bodies get flagged for `first` / `last` on
the strength of an activerecord `Relation` method.

## Acceptance criteria

- `isPortedWithArgs` resolves candidates within the same package (ideally the
  same file, falling back to package) rather than package + deps.
- The doc comment records why the wider lookup was wrong, so it is not widened
  back.
- Overlaps `ruby-extractor-record-call-receiver-kind` — sequence this after it
  and report the incremental delta, not the standalone one.
- Baseline reseeded; expected delta small (48 rows measured standalone
  post-receiver-scoping).
