---
title: "orderMatcherFor reads a live connection and falls back to the abstract matcher; Rails reads adapter_class"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6297
claim: "2026-08-09T20:29:15Z"
assignee: "date-carries-no-nth-so-huge-years-lose-exactness"
blocked-by: null
closed-reason: null
---

## Context

Rails reads the order matcher off the adapter CLASS, never off a live
connection: `disallow_raw_sql!(args, permit: adapter_class.column_name_matcher)`
(`activerecord/lib/active_record/sanitization.rb:183`), and `adapter_class` is a
class-level lookup that needs no checked-out connection.

trails' `orderMatcherFor` (`packages/activerecord/src/sanitization.ts`) instead
reaches through a live connection and swallows the connection error:

- it reads `host.connection`, catching `ConnectionNotDefined`;
- it then takes `conn.constructor.columnNameWithOrderMatcher`;
- and when either step comes up empty it falls back to the abstract
  `columnNameWithOrderMatcher`.

That is the same adapter-free-fallback shape PR #6290 removed from the quoter
half of this file, left behind because it is a different lookup. Two problems
follow: a host with no connection silently gets ANSI-ish permissiveness instead
of its adapter's real matcher, and the class-level value is being derived from
an instance that Rails never needs.

PR #6290 removed `ABSTRACT_QUOTER` and the standalone `quoteIdentifier`, and
made `quoterFor` propagate the connection error (see the `quoterFor` doc in the
same file for the Rails posture: `abstract/quoting.rb:61` is
`raise NotImplementedError`).

## Converged shape

Resolve the matcher from the adapter class the way Rails' `adapter_class` does
— off the model class, with no `connection` read and no try/catch — so
`disallow_raw_sql!` gets the same value Rails gives it and a missing adapter
surfaces rather than degrading to the abstract matcher.

Sequence against `adapterless-schema-quoters-force-lookup-cast-type-guards`
(in-progress, same RFC): it tracks the non-Rails guards the adapter-free hosts
force into `quote_default_expression` / `lookup_cast_type_from_column`, and both
stories are about removing the same fallback posture.

## Acceptance criteria

- [ ] `orderMatcherFor` is gone or reduced to Rails' `adapter_class` lookup,
      with no `host.connection` read and no `ConnectionNotDefined` catch.
- [ ] A host with no resolvable adapter surfaces an error rather than silently
      getting the abstract matcher.
- [ ] `sanitize.test.ts` and `sanitization-quoter.test.ts` pass on all three
      adapters.
- [ ] parity:api / parity:test delta non-negative.
