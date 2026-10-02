---
title: "ruby-compat: Float answers infinite? so BindParam#infinite? and Quoted#infinite? lose their Infinity arms"
status: done
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel", "ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8403
claim: "2026-10-02T14:41:55Z"
assignee: "ruby-compat-float-answers-infinite-for-arel-bind-and-quoted"
blocked-by: null
closed-reason: null
---

## Context

Left over from `arel-converge-invented-control-flow-arms`: `pnpm parity:api:arms:report --package=arel` still lists `nodes/bind-param.ts#isInfinite` and `nodes/casted.ts#isInfinite` (`Quoted`) at `+if +if`.

Rails' bodies are one expression (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/bind_param.rb:34-36`, `nodes/casted.rb:42-44`):

```ruby
def infinite?
  value.respond_to?(:infinite?) && value.infinite?
end
```

The trails ports (`packages/arel/src/nodes/bind-param.ts`, `packages/arel/src/nodes/casted.ts`) now end in `rbObjRespondTo(value, "isInfinite") && value.isInfinite()`, but each still opens with two invented arms, `if (this.value === Infinity) return 1` and `if (this.value === -Infinity) return -1`, because a JS `number` answers no `isInfinite`: ruby-compat has no port of `Float#infinite?` (`rb_flo_is_infinite_p`, `vendor/ruby/v3.3.11/numeric.c:1992`, defined at `numeric.c:6376`), so `rbObjRespondTo(Infinity, "isInfinite")` is false.

The same two arms are hand-rolled in `packages/activerecord/src/relation/query-attribute.ts` (`isInfinity`, the port of `query_attribute.rb:63-65`), `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:143` and `packages/arel/src/predications.ts` (`isInfinity`).

## Converged shape

ruby-compat answers `infinite?` for a Float seat the way it answers `empty?` / `[]` for the core classes in `basicObjRespondTo`, and `rbFSend(value, "isInfinite")` dispatches it (`1` / `-1` / `nil` per `rb_flo_is_infinite_p`). The four call sites become the Rails expression with no number arm.

## Acceptance criteria

- [ ] `rbObjRespondTo(Infinity, "isInfinite")` is true and the send answers `1` / `-1` / `null`, with an MRI citation and tests.
- [ ] `BindParam#isInfinite` and `Quoted#isInfinite` are the single Rails expression; `pnpm parity:api:arms:report --package=arel` no longer lists either.
- [ ] `QueryAttribute`'s `isInfinity`, `OID::Range` and `Predications#isInfinity` drop their `=== Infinity` arms.
