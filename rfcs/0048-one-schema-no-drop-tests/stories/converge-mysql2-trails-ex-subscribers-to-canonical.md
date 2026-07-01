---
title: "converge-mysql2-trails-ex-subscribers-to-canonical"
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

# Converge mysql2 `.trails` empty-result test off invented `ex_subscribers` table

## Context

`packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts:210`
holds the case `"#exec_query queries with an empty result set still return the
columns"`. The name is verbatim from Rails
`vendor/rails/activerecord/test/cases/adapter_test.rb:136`, and Rails runs it
against the canonical `subscribers` fixture table
(`SELECT * FROM subscribers WHERE 1=0`). The trails version instead
`CREATE TABLE ex_subscribers ...`/`DROP TABLE ex_subscribers` — an **invented**
scratch table shaped after `subscribers` (schema.rb: `id: false`; nick/name/
books_count; unique index on nick). `subscribers` IS in canonical `TEST_SCHEMA`
(`test-helpers/test-schema.*` ~line 1379).

Per RFC 0048 fidelity contract, a `.trails` test that has a real Rails
counterpart should not live in a `.trails` file at all, and must not create an
invented table name. This case was left out of the sibling audit PR
(audit-trails-ddl-tests-invented-tables-vs-rails) because the `describeIfMysql`
live-MySQL suite does not bootstrap the canonical schema, so switching straight
to `subscribers` requires ensuring that table+shape is present in the suite's DB
— which cannot be verified locally without MySQL and risks the CI mysql:8 job.

## Acceptance criteria

- The mysql2 empty-result-columns case no longer creates `ex_subscribers`
  (or any invented table); it uses the canonical `subscribers` table exactly as
  Rails `adapter_test.rb` does, or moves into the faithful `adapter_test` port.
- The live-MySQL suite has the canonical `subscribers` table available (bootstrap
  canonical schema if not already loaded), so the converged test runs green on
  the CI mysql:8 lane.
- Test name stays verbatim. `test:compare` does not regress.

## Notes

Follow-up to #4367 and the invented-scratch-table audit. Companion to
`fidelity-audit-canonical-scratch-and-bespoke-tables`.
