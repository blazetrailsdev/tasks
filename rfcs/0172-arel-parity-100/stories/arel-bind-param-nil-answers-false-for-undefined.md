---
title: "arel: BindParam#nil? answers false for an undefined value where Rails has only nil"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8397
claim: "2026-10-02T13:21:59Z"
assignee: "arel-bind-param-nil-answers-false-for-undefined"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8378 (`arel-converge-invented-control-flow-arms`).

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/bind_param.rb:22-24`):

```ruby
def nil?
  value.nil?
end
```

`packages/arel/src/nodes/bind-param.ts#isNil` is `value === null || (rbObjRespondTo(value, "isNil") && value.isNil())`. It answers `false` for a `BindParam` built with no argument (`value` is `undefined`), which `packages/arel/src/nodes/bind-param.trails.test.ts` pins as "is false for a valueless positional-bind placeholder". Rails has no such placeholder: `BindParam.new` takes a required `value` (`bind_param.rb:8-11`), and a `nil` value answers `nil?` true. So JS `undefined` and `null` are two different answers to one Ruby `nil`, and the body carries an `or` and an `and` Rails does not (`pnpm parity:api:arms:report --package=arel`, short-circuit projection).

`Casted#isNil` / `Quoted#isNil` in `packages/arel/src/nodes/casted.ts` already treat both as nil.

## Converged shape

`BindParam#isNil` answers through the value's `nil?` with `null` and `undefined` both nil, and the `value?` constructor parameter is required as Rails' is. Whatever relies on the valueless placeholder passes an explicit value.

## Acceptance criteria

- [ ] Find the callers constructing `new BindParam()` with no value and what they rely on.
- [ ] `BindParam#isNil` treats `undefined` as nil, or the placeholder use is given its own explicit value.
- [ ] The trails test pinning the `undefined` arm is rewritten against the Rails behaviour.
