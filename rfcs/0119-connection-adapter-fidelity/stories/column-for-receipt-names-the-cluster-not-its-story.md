---
title: "column_for's receipt names the cluster story, not mysql-mismatched-fk-details-omits-primary-key-column"
status: done
updated: 2026-08-29
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 7215
claim: "2026-08-29T18:33:52Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

PR #7163 stamped every bare `CONVERGEABLE` receipt with a story id. One of them
is pointed at a cluster story where a more specific, pre-existing story already
exists:

`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1019`

    @missingRailsCall column_for — CONVERGEABLE sqlite3-and-mysql-bare-missing-rails-call-receipts

Its pre-sweep prose at `9415a63a9~1` named
`mysql-mismatched-fk-details-omits-primary-key-column` (RFC 0112) instead, which
is the story that actually converges it: Rails sets
`options[:primary_key_column] = column_for(...)` in
`AbstractMysqlAdapter#mismatched_foreign_key_details`
(`abstract_mysql_adapter.rb:995`, mirrored at :978), an async schema read in
trails reached synchronously from `_translateException`, so the lookup happens
in `_enrichMismatchedForeignKey` instead.

## Converged shape

The receipt names `mysql-mismatched-fk-details-omits-primary-key-column`, and
converging that story makes the `column_for` call at the Rails site, retiring
the receipt entirely.

## Acceptance criteria

- The receipt at `abstract-mysql-adapter.ts:1019` names
  `mysql-mismatched-fk-details-omits-primary-key-column`, not the cluster story.
- `pnpm parity:api:reasons` and `pnpm parity:api:calls` stay green; no baseline
  row added.
