---
title: "activerecord: validate_order_args rejects Symbol directions Rails' VALID_DIRECTIONS accepts"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails accepts a Symbol order direction:
`VALID_DIRECTIONS = [:asc, :desc, :ASC, :DESC, "asc", "desc", "ASC", "DESC"].to_set`
and `validate_order_args` raises only when `VALID_DIRECTIONS.exclude?(value)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:2060-2074`).
So `Post.order(title: :desc)` is valid, and `preprocess_order_args` sends
`public_send(dir.downcase)` (`:2081-2116`).

trails' `packages/activerecord/src/relation/query-methods.ts` `VALID_DIRECTIONS` is
`new Set(["asc", "desc"])`, tested with `String(value).toLowerCase()`. That rejects the
Symbol spelling `":desc"` with `Direction ":desc" is invalid`, and accepts `"Desc"`, which
Rails rejects. trails#8424 made `preprocessOrderArgs` send `downcase` to the direction
(`rbFPublicSend(node, rbFSend(dir, "downcase"))`), so a Symbol direction now works once it
gets past validation. Nothing tests it end to end, because validation runs first.

The body's control-flow arms are listed in
`activerecord-converge-invented-control-flow-arms-relation-part-2`; this story is the
direction set and its Symbol members, which an arms pass need not touch.

## Acceptance criteria

- [ ] `VALID_DIRECTIONS` holds Rails' eight members (Symbols as `":asc"` etc.) and validation is a membership test with no case folding.
- [ ] `Post.order({ title: ":desc" })` orders descending; `{ title: "Desc" }` raises Rails' message.
- [ ] The message's `VALID_DIRECTIONS.to_a.inspect` is rendered from the set, not a literal.
