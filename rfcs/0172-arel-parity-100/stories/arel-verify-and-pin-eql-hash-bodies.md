---
title: "arel: verify and pin the 48 eql?/hash pairs matched since the body-pin floor"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: pins
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports arel **pins: 711/759 (48 unpinned)**. Every unpinned pair is an `eql?` / `hash`
definition RFC 0156 brought into scoring after the `--pin-all` floor
(`scripts/api-compare/body-pins.ts` header), across 24 files: `nodes/binary.rb`, `bind_param.rb`,
`bound_sql_literal.rb`, `case.rb`, `casted.rb`, `comment.rb`, `cte.rb`, `delete_statement.rb`,
`extract.rb`, `false.rb`, `fragments.rb`, `function.rb`, `homogeneous_in.rb`, `insert_statement.rb`,
`named_function.rb`, `nary.rb`, `select_core.rb`, `select_statement.rb`, `terminal.rb`, `true.rb`,
`unary.rb`, `update_statement.rb`, `window.rb`, and `table.rb` (all under `vendor/rails/v8.0.2/activerecord/lib/arel/`).

A pin records that a port was verified against a specific Rails body; pinning without verifying
defeats it.

## Acceptance criteria

- [ ] Each pair's TS `eql` / `hash` is checked line-for-line against its Rails body (same fields, same order, `hash` over the same tuple `==` compares) and fixed where it diverges.
- [ ] `pnpm tsx scripts/api-compare/body-pins.ts --pin <ruby-file>` per file, with a `reason` naming this story.
- [ ] `pnpm parity:api` arel pins: 711/759 → **759/759**; `pnpm parity:api:pins` green.
