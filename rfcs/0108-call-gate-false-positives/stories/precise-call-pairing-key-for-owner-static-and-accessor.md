---
title: "Give the call-gate row key owner/static/accessor precision"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: 6659
claim: "2026-08-17T17:01:13Z"
assignee: "precise-call-pairing-key-for-owner-static-and-accessor"
blocked-by: null
closed-reason: null
---

## Context

Combines five RFC 0025 drafts that are one root cause (swept 2026-08-17).

The call-set/call-argument gates key a row by `<package, tsFile, rubyName>`.
That key cannot express **which member** on either side the row is about, so
five distinct pairing failures fall out of it. All five are tooling artifacts:
no edit to the port can retire the rows they produce, and each one costs a
convergence story a round of analysis to conclude "nothing to do".

### 1. Nested class collapses onto the outer class's homonym

`ActiveRecord::Relation::ExplainProxy#first` / `#last` (`relation.rb:24-26`,
`:28-30`) are one-line `exec_explain { @relation.first(limit) }`. Because they
live in `relation.ts` alongside `Relation#first` / `#last`
(`finder_methods.rb:100-108`, `:123-131`), the extractor demands the
finder-methods call set from the proxy's bodies. PR #6603 baselined four rows in
`call-mismatches-exclude/activerecord/relation.json`: `first|find_nth`,
`first|find_nth_with_limit`, `last|find_last`, `last|limit`. `#average` /
`#count` / `#maximum` / `#minimum` / `#pluck` / `#sum` escaped only because
trails mixes those in from `relation/calculations.ts` — the four rows are an
accident of which homonyms share a file, not a bounded set.

### 2. Instance method pairs with the `ClassMethods` homonym

`persistence.rb` defines `_update_record` twice — ClassMethods (`:687-692`) and
instance (`:900-916`). trails mirrors both in `persistence.ts` (`:316` and
`instanceUpdateRecord` exported onto the prototype). The extractor pairs the
Ruby _instance_ method with the TS _ClassMethods_ body, so PR #6430 made the
instance body call `attributesForUpdate` — exactly `persistence.rb:901` — and
`call-mismatches-exclude/activerecord/persistence.json:33-36` did **not** go
stale. Un-retirable by writing correct code. Silent and bidirectional: a
genuine omission in either body can be masked by the other.

### 3. Mixin-seam member double-matches its module file

Rails houses PG methods in included modules — `PostgreSQL::Quoting#quoted_date`
(`postgresql/quoting.rb:143`), `#quoted_binary` (`:152`),
`#lookup_cast_type_from_column` (`:189`),
`DatabaseStatements#returning_column_values`
(`postgresql/database_statements.rb:208`),
`ReferentialIntegrity#disable_referential_integrity`
(`postgresql/referential_integrity.rb:7`). trails ports each body into the
matching module file, where it compares green — then the adapter's `include`-seam
member at the same name is matched a _second_ time and makes none of the calls.
`call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
carries **15 rows** today (re-counted 2026-08-17). Not PG-specific: any adapter
mixing in a Rails module and keeping a seam member hits it.

### 4. Credit leaks between sibling members of one class

Found landing PR #6639 (RFC 0107). Moving `Relation#length` into
`DelegationMethods` — its faithful home per
`relation/delegation.rb:101`'s `delegate :to_xml, :encode_with, :length, :each,
… to: :records` — turned rows red in **three other methods**:

```text
+ activerecord relation.ts apply_join_dependency with_connection
+ activerecord relation.ts create_or_find_by      with_connection
+ activerecord relation.ts to_sql                 with_connection
```

Those bodies do not call `withConnection` and never did; Rails'
`create_or_find_by` (`relation.rb:274`) and `to_sql` DO, so the rows are TRUE
omissions the comparator had been crediting anyway off an unrelated member's
presence in the class body. Bisected to that one member, reproducibly. This is
the reason RFC 0107's `converge-relation-length-onto-records-delegation` is
**blocked** — it is the live consumer of this story.

### 5. Ruby writer pairs with the reader instead of `setX`

`rubyMethodToTs` maps `foo=` to `[camel, "set"+Camel]`, bare-camel first
(`scripts/parity/conventions.ts:1210-1223`). The bare name is the READER, so a
pair ported as reader `foo()` + awaitable `setFoo()` — the sanctioned shape per
CLAUDE.md for a writer whose Rails body blocks on I/O — compares the Ruby
WRITER's call set against the READER's body. Rows are identifiable by `tsName`
being the reader:

```json
{
  "rubyName": "backend=",
  "tsName": "backend",
  "missing": ["cast_backend_name_to_module → castBackendNameToModule"]
}
```

Surfaced by PR #6441 (`port-xml-mini-backend-and-parsing-half`).

## Converged shape

Give the row key enough information to name the member on both sides. The
extractors already know all of it — owner kind (class / module / nested class),
static-vs-instance, and accessor kind — they just discard it before pairing.
Resolve the Ruby method to exactly one TS member and compare only that one;
where no unambiguous resolution exists, record nothing rather than pairing
wrongly (the `ownerRecordsNothing` precedent in `compare.ts`).

## Acceptance criteria

- The row key distinguishes owner (outer class vs nested class vs module),
  static vs instance, and reader vs writer.
- Each cited row goes STALE and is deleted by hand (only-shrink, no reseed),
  then `pnpm parity:api:calls:tighten` run for the affected shards:
  - 4 rows in `call-mismatches-exclude/activerecord/relation.json`
    (`first|find_nth`, `first|find_nth_with_limit`, `last|find_last`,
    `last|limit`)
  - the `_update_record|attributes_for_update` row in
    `call-mismatches-exclude/activerecord/persistence.json`
  - the mixin-seam rows in
    `call-mismatches-exclude/activerecord/connection-adapters/postgresql-adapter.json`
  - any `tsName`-is-reader writer rows
- Moving `Relation#length` into `DelegationMethods` no longer reds
  `apply_join_dependency`, `create_or_find_by` or `to_sql` — i.e. RFC 0107's
  `converge-relation-length-onto-records-delegation` unblocks. Add that as a
  regression test.
- `scripts/api-compare` unit tests cover all five shapes.
- No package's call-mismatch row count rises.

_Moved from RFC 0025 in the 2026-08-17 scoping split: RFC 0025 had grown to 262
stories. This story is a call-gate **false positive** — the tool reports a
mismatch where the port is faithful — which is the whole scope of the new RFC._
