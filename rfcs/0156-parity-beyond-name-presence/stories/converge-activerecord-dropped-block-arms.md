---
title: "Converge activerecord's dropped block arms flagged by parity:api:blocks"
status: draft
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:blocks` (trails#7960) flags 155 Ruby methods that take a block (`&blk`, `yield`, `block_given?`) whose TS port has no function-typed parameter; the per-file marks are in `scripts/api-compare/block-param-mark.json`, the rows in `scripts/api-compare/output/block-param-mismatches.json`. activerecord examples: `find_each` / `find_in_batches` (`vendor/rails/activerecord/lib/active_record/relation/batches.rb:85-160`), `find_or_create_by` / `create_or_find_by` / `find_or_initialize_by` (`relation.rb:231-302`), `select` / `with` (`relation/query_methods.rb`).

## Acceptance criteria

- The activerecord rows converge: each port takes Rails' block as a trailing function parameter (or `block()` from ruby-compat for value-or-block), with the block arm's control flow ported.
- The activerecord marks are narrowed with `pnpm parity:api:blocks:tighten`.
- Other packages get one story each when started.
