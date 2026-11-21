---
title: "OrderedHash each* overrides: inherit from ruby-compat Hash or bare PERMANENT receipts"
status: ready
updated: 2026-11-21
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/ordered-hash.ts` carries `@noRailsEquivalent PERMANENT — Ruby core …` receipts with trailing prose on `eachValue`, `eachKey`, `eachPair` and `each` (Ruby core `Hash#each_value` `vendor/ruby/v3.3.11/hash.c:3060`, `#each_key` `:3098`, `#each_pair` `:3149`, `#each` `:7219`). CLAUDE.md says a receipt is the bare token; prose belongs in the JSDoc description. trails#10461 fixed `invert` this way and left these four.

These are Ruby core `Hash` members `OrderedHash < ::Hash` inherits (`vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_hash.rb:24`). The converged shape deletes the overrides wherever ruby-compat `Hash` already answers them (as `deleteIf` / `shift` were in #10461), and otherwise moves the prose into the description so the tag is bare.

## Acceptance criteria

- Each of the four is deleted in favour of the inherited ruby-compat `Hash` member, or keeps a bare `@noRailsEquivalent PERMANENT` with its citation in the description.
- `pnpm parity:api:extra --package activesupport` reports 0 novel for `ordered-hash.ts`.
- `packages/activesupport/test/ordered-hash.test.ts` stays green.
