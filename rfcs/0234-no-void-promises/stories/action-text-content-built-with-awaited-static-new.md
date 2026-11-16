---
title: "action-text-content-built-with-awaited-static-new"
status: draft
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `async-initialize-becomes-static-new` (RFC 0234 § Design 2(a)).
`packages/actiontext/lib/content.ts` constructor chains
`fragmentByCanonicalizingContent(content).then(...)` into a stored
`canonicalized` promise, which `rich-text.ts:32`'s `before_save` awaits.
Rails' `ActionText::Content#initialize`
(`vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb:40-48`) canonicalizes
in line.

The blocker for a `static async new`: `Serialization.load` / `.dump`
(`packages/actiontext/lib/serialization.ts`, Rails
`vendor/rails/v8.0.2/actiontext/lib/action_text/serialization.rb`) call
`new(content)` and are the `serialize :body, coder: ActionText::Content` coder,
which ActiveRecord's serialized type calls synchronously on read and cast.
Canonicalization awaits `Attachable.fromNode` (GlobalID locate, a query), so
`load` cannot become sync and the coder cannot await. Deciding how the coder
reaches an awaited `Content.new` (an async coder path in the serialized type,
or canonicalizing at a different awaited step) is an operator decision.

## Acceptance criteria

- [ ] `Content` has a `protected` constructor and `static async new` running the canonicalization; `canonicalized` is deleted.
- [ ] Every caller, including `Serialization.load` / `dump` and `appendAttachables` / `renderAttachments`, awaits `Content.new`.
- [ ] A rejection from canonicalization surfaces at `await Content.new(...)`, with a test.
- [ ] The `constructor` mark for actiontext drops.
