---
title: "Mass-assigned collection replace refuses three Rails call sites instead of performing them"
status: draft
updated: 2026-08-14
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
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

Rails assigns a collection inline at assignment time. `assign_attributes` sets
each attribute synchronously and returns nil
(`activemodel/lib/active_model/attribute_assignment.rb:32-35`), and the
collection writer it reaches is `CollectionAssociation#replace`
(`activerecord/lib/active_record/associations/collection_association.rb:242-256`),
which loads, diffs, and runs the deletes + inserts there and then.

trails' non-awaitable path — `CollectionAssociation#syncWrite`, reached from
mass assignment and the constructor form — cannot do synchronous DB I/O, so it
REFUSES instead, throwing `CollectionPersistedAssignmentError` and naming the
awaitable Rails-named form (RFC 0068, "why loud beats deferred").

PR #6506 widened that refusal, because its `load_target` convergence gave the
new-owner arm real I/O to owe. `syncWrite` now throws when ANY of:

- the owner is persisted (the original arm);
- `find_target?` holds, so Rails' unconditional `load_target`
  (`collection_association.rb:244`) is a query (`association.rb:190`) — i.e. a
  NEW owner whose primary key is already set, e.g. `new Firm({ id: 5, clients: [...] })`;
- the removal set contains an already-persisted record, which Rails deletes in a
  transaction (`delete_or_destroy`, `:392-397`).

The widening is correct as a refusal — it replaced silently-wrong behaviour
(the old arm diffed against an empty baseline, or skipped `delete_records`
outright) — but each arm is a Rails call site trails does not execute. `new
Firm({ id: 5, clients: [...] })` is valid Ruby that trails now rejects.

## Converged shape

Mass assignment of a collection reaches the same work Rails does rather than
refusing it. The shape RFC 0087 established for the sync/async split is the
lead: assignment parks the work and the owner's `save()` drains it, so the
inline semantics are preserved at the only point JS can await. That is what
`syncWrite`'s doc comment currently argues against ("a deferred delete can race
an interim insert"), so this story has to settle that first — the park/drain
machinery has since landed for nested attributes and may answer it.

If it genuinely cannot converge, `pnpm tasks block` it with the specific
blocker; do NOT close it by rewriting the justification.

## Acceptance criteria

- [ ] `new Owner({ items: [...] })` and `assignAttributes({ items: [...] })`
      perform Rails' replace on every owner arm, or the story is blocked with a
      named blocker.
- [ ] No arm of `syncWrite` silently schedules or drops DB work — whatever it
      does not execute, it refuses loudly (the current behaviour is the floor,
      not a regression target).
- [ ] Coverage for all three arms above, including the new-owner-with-primary-key
      case pinned in `collection-proxy-replace-diff.trails.test.ts`.
