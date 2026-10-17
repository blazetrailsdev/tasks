---
title: "i18n: KeyValue#store_translations merges a plain-object caller's subtrees (key_value.rb:86-100)"
status: draft
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`I18n::Backend::KeyValue#store_translations` (`vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:86-100`) deep-merges a subtree only under `case value when Hash`. Since trails#8992 the trails port tests `is_a?(Hash)` as `instanceof Map || SubtreeProxy` (`packages/i18n/src/backend/key-value.ts`). So a trails caller that passes a plain object, the ordinary TS spelling of a Ruby Hash literal, gets its subtrees written over instead of merged into the stored value. `Simple#store_translations` does not have this problem, because it runs `Utils.deep_symbolize_keys` (`simple.rb:46`). KeyValue does not, in Rails either. `key-value.test.ts` now passes `deepSymbolizeKeys(data)` to stay faithful.

## Acceptance criteria

- [ ] Decide where a plain-object caller of `KeyValue#store_translations` becomes a `Hash`: at the public i18n entry point (`I18n.backend.store_translations`), or nowhere, in which case document that KeyValue takes `Hash` data. Do not add an arm inside the ported `store_translations` body.
- [ ] A test stores a plain nested object into a subtree-enabled KeyValue backend twice and asserts Rails' merged result, or asserts the documented contract.
