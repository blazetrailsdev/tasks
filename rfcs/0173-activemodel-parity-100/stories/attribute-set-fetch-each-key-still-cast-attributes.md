---
title: "activemodel: AttributeSet#fetch / keys / accessed still cast attributes; fetch, eachKey and hasKey take the receiver type"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8459
claim: "2026-10-03T22:42:43Z"
assignee: "attribute-set-fetch-each-key-still-cast-attributes"
blocked-by: null
closed-reason: null
---

## Context

trails PR 8455 gave ruby-compat's `eachValue`, `transformValues` and `except`
(`packages/ruby-compat/src/hash.ts`) a receiver type naming the method they send to a non-Hash
receiver, which removed the casts from `AttributeSet#eachValue` / `#except` / `#castTypes` and its
siblings. Three bodies in `packages/activemodel/src/attribute-set.ts` still cast
`this.attributes() as Record<string, Attribute>`, because `fetch`, `eachKey` and `hasKey` dispatch
through `ownMethod` the same way but are still typed `Record<string, …>`:

- `fetch` — `attribute_set.rb:10` `delegate :each_value, :fetch, :except, to: :attributes`
- `keys` — `attribute_set.rb:46` `attributes.each_key.select { … }`
- `accessed` — `attribute_set.rb:92` `attributes.each_key.select { … }`

`eachValue`'s first overload also still returns `Record<string, T>` for the dispatched arm, where
the receiver's own `eachValue` returns whatever it returns.

## Acceptance criteria

- [ ] `fetch`, `eachKey` and `hasKey` take a receiver type that admits a non-Hash receiver defining `fetch` / `eachKey` / `isKey`, and `attribute-set.ts` has no `as Record<string, Attribute>` cast on `this.attributes()`.
- [ ] `eachValue`'s return type is honest for the dispatched arm.
- [ ] `pnpm typecheck`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm vitest run packages/activemodel/src/attribute-set packages/ruby-compat/src/hash.trails.test.ts` pass.
