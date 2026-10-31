---
title: "activestorage-create-awaits-attachment-writers"
status: done
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9530
claim: "2026-10-31T13:36:40Z"
assignee: "activestorage-create-awaits-attachment-writers"
blocked-by: null
closed-reason: null
---

## Context

RFC 0209 "Attaching" says `User.create!(avatar: file)` goes through the awaitable
path, but `Persistence.create` / `createBang`
(`packages/activerecord/src/persistence.ts:58-105`) call `new this(attributes, …)`,
and the constructor's `assignAttributes` (`base.ts:1383`) raises for an attachment
key because `setAvatar` is async. Rails: `persistence.rb:33-58`,
`attached/model.rb:117-126`. `update` already works through `setAttributes`.

## Acceptance criteria

- `await User.createBang({ name, avatar: file })` and `create` attach the file,
  awaiting the writer before `save`, with no promise parked for `save` to drain.
- `new User({ avatar: file })` still raises.
- Relation and association create paths behave the same.
