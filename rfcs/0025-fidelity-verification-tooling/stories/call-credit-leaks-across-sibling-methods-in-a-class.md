---
title: "Call-set credit for one method depends on another member's presence in the TS class body"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by precise-call-pairing-key-for-owner-static-and-accessor (2026-08-17 sweep): all five are one root cause — the <package,tsFile,rubyName> row key cannot name the member on either side. Every citation and baselined row from this story is carried into that body as an acceptance criterion."
---

## Context

Found while landing PR #6639 (RFC 0107 `give-relation-enumerable-surface-one-mechanism`).

`Relation#length` was moved out of `relation.ts`'s class body into
`DelegationMethods` — the faithful home, since `length` is on
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101`'s
`delegate :to_xml, :encode_with, :length, :each, … to: :records` list, exactly
like `each` / `join` / `compact` which already live there.

That move turned FOUR call-set rows red in `pnpm parity:api:calls`, none of
them in `length`:

    + activerecord  relation.ts  apply_join_dependency  with_connection
    + activerecord  relation.ts  create_or_find_by      with_connection
    + activerecord  relation.ts  to_sql                 with_connection

Those three TS bodies do not call `withConnection` and never did — Rails'
`create_or_find_by` (relation.rb:274) and `to_sql` DO wrap in
`with_connection`, so the rows are TRUE omissions that the comparator had been
crediting anyway. The credit is keyed on something about `relation.ts`'s
class-body member set: restoring `length` as a class-body method (with every
other change from that PR intact) makes all four rows go green again,
reproducibly. Bisected to exactly that one member; `suppressed` and the
per-method `missing` sets were compared between runs and nothing else moved.

Consequences: the ratchet silently credits calls a body does not make, and the
credit is load-bearing enough that an unrelated, faithful refactor of a
different method cannot land. `length` was left in `relation.ts` on that PR
rather than baselining four rows for bodies whose omission was not being
introduced by the change.

## Converged shape

Find why a method's presence in the TS class body confers a `with_connection`
credit on sibling methods (start at `collectAllowedNames` / the call-credit
path in `scripts/api-compare/compare.ts`, and at how `relation.ts`'s Ruby
entity resolves against the `class Relation` body vs the merged
`export interface Relation<T>` declaration — `relation.ts` has both). Credit a
call only when the method's own body makes it. Expect the fix to SURFACE the
three genuine `with_connection` omissions above; converge them or baseline
them with a reviewed reason as part of the fix.

## Acceptance criteria

- A regression test that fails on today's comparator: removing an unrelated
  member from a TS class body must not change any other method's call credit.
- `pnpm parity:api:calls` green, with the three `relation.ts` `with_connection`
  rows either converged or carrying a reviewed one-line baseline reason.
- Unblocks `converge-relation-length-onto-records-delegation`.
