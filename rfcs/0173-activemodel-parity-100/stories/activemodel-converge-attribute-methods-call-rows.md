---
title: "activemodel: converge the 3 attribute-methods.ts call-set rows"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json` carries three
reviewed `calls` rows:

- `attribute_method?` omits `include?` — `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:541`
  is `attributes.include?(attr_name)` over a Ruby Hash; trails' `attributes` is a plain object.
- `define_call` omits `match?` — `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:455` guards the
  `send` arm with `CALL_COMPILABLE_REGEXP.match?(target_name)`.
- `resolve_attribute_name` omits `fetch` — `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:396`
  is `attribute_aliases.fetch(super, &:itself)`.

Each reason describes a JS data-shape choice, not a language shortcoming: ruby-compat carries
`hasKey` / `fetch` with block (`packages/ruby-compat/src/hash.ts`), and `CALL_COMPILABLE_REGEXP`
can be tested before the descriptor branch just as Rails tests it before `send`.

## Acceptance criteria

- [ ] Each body makes the call Rails makes (`hasKey`/`include?` through ruby-compat, the `CALL_COMPILABLE_REGEXP.test` guard with its arm, `fetch(aliases, name, block(itself))`).
- [ ] The three rows are deleted from the shard (the shard file removed), and `pnpm parity:api:calls:tighten activemodel/attribute-methods.json` narrows the mark.
- [ ] `pnpm parity:api:calls` green; activemodel + activerecord attribute-method tests green.
