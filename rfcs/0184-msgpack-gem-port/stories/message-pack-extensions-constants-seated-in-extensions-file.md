---
title: "activesupport: MessagePack's Extensions and error classes are seated by extensions.ts, as extensions.rb:14-17 defines them"
status: draft
updated: 2026-10-15
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8922 seated `Extensions`, `UnserializableObjectError` and `MissingClassError` on `ActiveSupport::MessagePack`. The `rbModConstSet` calls live in `packages/activesupport/src/message-pack.ts`. In Rails the constants are defined inside `module ActiveSupport::MessagePack` in `vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack/extensions.rb:14-17`, the file that defines them. `extensions.ts` cannot seat them today, because `MessagePack` is constructed in `message-pack.ts`, which imports `extensions.ts` first.

## Acceptance criteria

- The `MessagePack` module is created where `extensions.ts` can reach it at load: for example, opened in `namespaces.ts` or in a zero-import module, as Ruby's `module ActiveSupport; module MessagePack` reopening does.
- `extensions.ts` seats its own three constants.
- Every `dist/message-pack*.js` module still loads as a plain-node entry.
