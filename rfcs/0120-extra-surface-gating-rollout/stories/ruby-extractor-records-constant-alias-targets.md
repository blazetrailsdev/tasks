---
title: "Ruby extractor records constant alias targets; resolveDelegatedClass drops its suffix fallback"
status: done
updated: 2026-10-20
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: trails#9110
claim: "2026-10-20T00:17:53Z"
assignee: "rack-sendfile-variation-header-arm-vs-vendored"
blocked-by: null
closed-reason: null
---

## Context

`resolveDelegatedClass` in `scripts/api-compare/extra-surface.ts` (added by trails#8829) resolves the `X` of a `DelegateClass(X)` superclass lexically, and when that misses it falls back to "the one class whose FQN ends in the written name". The fallback exists because Ruby reaches the class through a constant alias the manifest does not record:
`ActiveRecord::Locking::LockingType < DelegateClass(Type::Value)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/locking/optimistic.rb:206`) binds `Type::Value` to `ActiveRecord::Type::Value`, which is `Value = ActiveModel::Type::Value` in `vendor/rails/v8.0.2/activerecord/lib/active_record/type.rb`.

The Ruby extractor records that assignment in `fileConstants["type.rb"]` only as `{ "kind": "expr" }`, with no target, so no consumer can follow it. The suffix match is a guess standing in for the alias: it resolves to nothing when two classes share the suffix, and it could bind the wrong class if a package ever adds a second `…::Type::Value`.

## Converged shape

- `scripts/api-compare/extract-ruby-api.rb` records the target of a constant assignment whose right-hand side is a bare constant reference (`Value = ActiveModel::Type::Value`), for example as `{ "kind": "alias", "target": "ActiveModel::Type::Value" }`, with the enclosing namespace so the alias has an FQN.
- `resolveDelegatedClass` follows the recorded alias after its lexical walk and the unique-suffix fallback is deleted.

## Acceptance criteria

- `rails-api.json` records the alias target for `ActiveRecord::Type::Value` (and the sibling aliases in `type.rb`).
- `resolveDelegatedClass` has no suffix-match arm; `LockingType`'s delegated parent still resolves to `ActiveModel::Type::Value`.
- The `DelegateClass` case in `scripts/api-compare/extra-surface.test.ts` passes with the alias expressed through the manifest, and `pnpm parity:api:extra:gate` stays green.
