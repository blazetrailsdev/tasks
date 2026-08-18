---
title: 'Company sets inheritance_column = "type", which Rails'' company.rb does not'
status: claimed
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-18T22:11:19Z"
assignee: "suppressed-call-lets-sibling-claim-ts-candidate"
blocked-by: null
closed-reason: null
---

# Company sets `inheritance_column = "type"`, which Rails' company.rb does not

## Context

Surfaced in PR #6720 while measuring
`converge-new-sti-gate-drop-stienabled-disjunct` (blocked in the same RFC).

`packages/activerecord/src/test-helpers/models/company.ts:644`:

```ts
Company.inheritanceColumn = "type";
```

Rails' `vendor/rails/activerecord/test/models/company.rb` has no such
assignment — `Company < AbstractCompany` relies on the DEFAULT inheritance
column, which is already `"type"`, and on the real `companies.type` column in
`vendor/rails/activerecord/test/schema/schema.rb`. Per CLAUDE.md the canonical
test models must mirror Rails' exactly, so this is an invented line in a
canonical model file.

It is not cosmetic. `stiEnabled` (`packages/activerecord/src/inheritance.ts:455`)
is `_inheritanceColumn != null`, i.e. it reports "someone assigned the column",
and this line is what makes it true for the whole Company/Client/Firm tree. That
signal is load-bearing in at least:

- `subclassFromAttributesForNew`'s gate
  (`packages/activerecord/src/inheritance.ts`), whose `!stiEnabled(...)` disjunct
  is the deviation `converge-new-sti-gate-drop-stienabled-disjunct` exists to
  remove — it stands in for Rails' `_has_attribute?(inheritance_column)`
  (`vendor/rails/activerecord/lib/active_record/inheritance.rb:61`) over the
  window where reflection is still cold;
- `findStiClassForRow` (`inheritance.ts`), which raises vs. degrades to the base
  class on that same flag.

So deleting the line in isolation will change STI dispatch for the canonical
company fixtures, and the two stories are coupled: the blocked one cannot
converge while `stiEnabled` is doing work that only this invented assignment
enables.

## Converged shape

Delete `Company.inheritanceColumn = "type"` so the model matches
`company.rb`, and let the `type` column come from reflection of the canonical
schema, as it does in Rails. That requires the consumers above to stop reading
`stiEnabled` as a proxy for "this hierarchy is STI" — the same synchronous
schema-signal problem recorded as the blocker on
`converge-new-sti-gate-drop-stienabled-disjunct`, so sequence this after (or
together with) that one.

Audit the other `inheritanceColumn` assignments in
`packages/activerecord/src/test-helpers/models/` against their Rails
counterparts at the same time — `parrot.ts:28`
(`parrot_sti_class`), `membership.ts:62` and the `post.ts` `"disabled"` ones are
each either real in Rails or not, and only the real ones should survive.

## Acceptance criteria

- [ ] `packages/activerecord/src/test-helpers/models/company.ts` carries no
      `inheritanceColumn` assignment, matching
      `vendor/rails/activerecord/test/models/company.rb`.
- [ ] Every remaining `inheritanceColumn` assignment under
      `test-helpers/models/` is present in the mirrored Rails model file, cited
      by `file.rb:LINE`.
- [ ] STI dispatch for the company tree still matches Rails at `new`,
      `instantiate` and association build; the Rails-mirrored inheritance suites
      stay green.
- [ ] `parity:api` / `parity:test` deltas non-negative.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
