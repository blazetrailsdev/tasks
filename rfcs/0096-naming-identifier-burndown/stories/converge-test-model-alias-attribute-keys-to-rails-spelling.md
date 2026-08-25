---
title: "Converge test-model alias_attribute keys to Rails' snake_case spelling"
status: done
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6824
claim: "2026-08-21T15:20:36Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-2"
blocked-by: null
closed-reason: null
---

## Context

The canonical test models spell `alias_attribute` **keys** in camelCase where
Rails spells them snake_case. The alias key is an attribute name, so it is
subject to the same "table, column, and model names must match Rails exactly"
rule as any column — and it is user-visible: it is the name `where`, `pluck`,
`has_attribute?` and the generated accessor all answer to.

| trails                                                                   | Rails                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `account.ts:35` `aliasAttribute("availableCredit", "credit_limit")`      | `account.rb:7` `alias_attribute :available_credit, :credit_limit`       |
| `reply.ts:31` `aliasAttribute("newContent", "content")`                  | `reply.rb:13` `alias_attribute :new_content, :content`                  |
| `reply.ts:32` `aliasAttribute("newParentId", "parent_id")`               | `reply.rb:14` `alias_attribute :new_parent_id, :parent_id`              |
| `topic.ts:210` / `cpk.ts:216` `aliasAttribute("idValue", "id")`          | `topic.rb:148` `alias_attribute :id_value, :id`                         |
| `post.ts:189` `aliasAttribute("commentsCount", "legacy_comments_count")` | `post.rb:33` `alias_attribute :comments_count, :legacy_comments_count`  |
| `numeric-data.ts:24` `aliasAttribute("newBankBalance", "bank_balance")`  | `numeric_data.rb:11` `alias_attribute :new_bank_balance, :bank_balance` |

`post.ts` registers **both** spellings (`:189` camelCase and `:191` snake_case)
for the same target, which is the shape to remove: one alias, spelled as Rails
spells it.

## Why this is now a plain naming fix

Until PR #6781 these camelCase keys were propped up by `resolveAliasNameIn`, a
trails-only camelCase-key bridge that retried a missed snake_case lookup under
its camelized spelling. That bridge is deleted (its four pinning tests with it),
and `Company`'s key was converged to `new_name` (`company.rb:22`) as part of the
same PR. Nothing resolves these six through a bridge any more — they work only
because callers happen to use the camelCase spelling — so converging them is a
mechanical rename with no machinery to unpick.

`#6781` also shows the trap: a bare object key (`where().not({ newName: ... })`)
is not matched by a grep for `"newName"` or `.newName`, and it reds all three
adapters. Grep for the bare identifier, and run
`pnpm vitest run packages/activerecord/src/relation` — that directory is where
the miss surfaced.

## Call-site sizing

`idValue` 40 references, `commentsCount` 31, `availableCredit` 9,
`newBankBalance` 5, `newContent` 2, `newParentId` 2.

## Acceptance criteria

- Each `aliasAttribute` call in `packages/activerecord/src/test-helpers/models/`
  uses the Rails key verbatim, cited to its `models/*.rb:LINE`.
- `post.ts`'s duplicate camelCase registration is removed — one alias per Rails
  `alias_attribute`.
- Every reader is updated, including bare object keys in `where` / `where.not`
  hashes, string column names, and generated accessor reads.
- `pnpm vitest run packages/activerecord/src/relation` and the association,
  calculation, finder and validation suites that read these aliases stay green.
- Parity deltas non-negative for activerecord.
