---
title: "credit inherited methods to the ancestor's own file (last data-layer gap)"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6109
claim: "2026-08-05T01:11:00Z"
assignee: "pin-writing-pool-list-in-setup-transactional-fixtures"
blocked-by: null
closed-reason: null
---

## Context

After PR #6103 credited include-flattened mixin methods to the file that defines
them, the data layer sits at **7815/7816** — one missing method left:

```text
activerecord  connection_adapters/postgresql/schema_definitions.rb  integer_like_primary_key_type
```

`TableDefinition#integer_like_primary_key_type` is defined on
`ActiveRecord::ConnectionAdapters::PostgreSQL::TableDefinition`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_definitions.rb`),
which subclasses the abstract `TableDefinition`
(`connection_adapters/abstract/schema_definitions.rb`). trails implements it on
the abstract class in `connection-adapters/abstract/schema-definitions.ts` and
inherits it, exactly as Rails' own hierarchy allows — but the comparator expects
each subclass's own methods in the file mirroring the subclass's `.rb`, so the
inherited implementation is not credited.

The triage in PR #6099's `docs/infrastructure/mixin-attribution-triage.md`
(2026-08-04, row 13) classifies this one as mis-attributed via **inheritance**,
a different mechanism from the include-flattening #6103 fixed.

## Converged shape

Mirror `mixinMethodCreditedToOwnFile` (`scripts/api-compare/compare.ts`) for the
superclass axis: when a Ruby method is declared on an ancestor whose own `.rb`
has a bucket in the run, and the TS file mirroring that ancestor's `.rb` carries
one of its TS candidates, credit the subclass's expectation as a move to that
file rather than reporting it missing. Same three guards (ancestor file has a
bucket, differs from the host file, TS candidate actually present), same
credit-not-drop accounting so the denominator is unchanged, and the same
skip of the advisory arity/calls checks (the pair is already compared in the
ancestor's own bucket).

Note this is the credit direction only — it must not credit a method the
subclass genuinely needs to override and does not.

## Acceptance criteria

- `connection_adapters/postgresql/schema_definitions.rb` reports 0 missing and
  the data layer reaches 7816/7816.
- Unit coverage in `scripts/api-compare/compare.test.ts` for the credit branch
  and for each guard that must NOT credit.
- No exclusion-file rows added; no other package's matched total decreases.
