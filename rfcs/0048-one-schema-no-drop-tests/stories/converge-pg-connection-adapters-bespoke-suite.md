---
title: "converge-pg-connection-adapters-bespoke-suite"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `converge-pg-adapter-test-files-one-schema` (RFC 0048). That
story's PR converged
`packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts`
to a faithful, Rails-ordered word-for-word port of
`vendor/rails/activerecord/test/cases/adapters/postgresql/postgresql_adapter_test.rb`
(withExampleTable over the ephemeral `ex` table; two surfaced-deviation impl
fixes: pkAndSequenceFor null-when-no-sequence, and INCLUDE-column quote
un-doubling in index introspection).

The remaining two files in that story were NOT touched and are large,
all-or-nothing per-file ports, so they land as their own PR(s):

- `packages/activerecord/src/connection-adapters/postgresql-adapter.test.ts`
  (~1271 LOC) has NO 1:1 Rails source
  (`vendor/rails/.../connection_adapters/postgresql_adapter_test.rb` does not
  exist). It is a bespoke integration suite (invented `Product` model,
  non-Rails test names covering raw SQL execution, transactions, Base/Relation
  integration, schema introspection, check/foreign-key/exclusion constraints).
  Per the RFC 0048 Convergence contract: delete it and port the real Rails test
  cases that cover this behavior, or fold coverage into the adapters/postgresql
  port. Audit each bespoke case for existing Rails coverage before deleting to
  avoid coverage loss.

- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`
  (~996 LOC) is a trails-only extension — keep as-is unless a case duplicates a
  Rails case being ported; do not invent a Rails source for it.

## Acceptance criteria

- [ ] `connection-adapters/postgresql-adapter.test.ts` bespoke cases are either
      converged to real Rails-sourced tests or removed with their coverage
      confirmed present elsewhere (documented per-case).
- [ ] No canonical-schema violations (no invented `Product` model / bespoke
      tables); ride canonical TEST_SCHEMA + official models + real fixtures.
- [ ] trails.test.ts left intact except for de-duplicating any case that moved
      into a Rails-mirrored file.
- [ ] PR from main, non-overlapping files, draft. LOC ceiling per campaign.
