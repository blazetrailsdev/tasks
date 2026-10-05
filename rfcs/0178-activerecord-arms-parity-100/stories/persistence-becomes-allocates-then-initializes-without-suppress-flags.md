---
title: "activerecord: Persistence#becomes is allocate plus initialize, with no suppress-flag try/restore"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: ["base-allocate-comes-from-a-ruby-compat-rb-obj-alloc"]
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

Split from `activerecord-converge-invented-control-flow-arms-root-g-p-part-3`, which converged every
other row it listed in `persistence.ts`. `pnpm parity:api:arms:report --package=activerecord
--direction=invented` still lists `persistence.ts#becomes` at `+try +if +if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:487-500`):

```ruby
def becomes(klass)
  became = klass.allocate

  became.send(:initialize) do |becoming|
    @attributes.reverse_merge!(becoming.instance_variable_get(:@attributes))
    becoming.instance_variable_set(:@attributes, @attributes)
    becoming.instance_variable_set(:@mutations_from_database, @mutations_from_database ||= nil)
    becoming.instance_variable_set(:@new_record, new_record?)
    becoming.instance_variable_set(:@destroyed, destroyed?)
    becoming.errors.copy!(errors)
  end

  became
end
```

`allocate` + `send(:initialize)` runs `Core#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482`) without going through
`Inheritance::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56-78`),
so it skips the abstract-class raise and the STI `subclass_from_attributes` dispatch.

`packages/activerecord/src/persistence.ts#becomes` cannot say that today: the `Base` constructor
(`packages/activerecord/src/base.ts`, `constructor(attributes, initBlock)`) is `new` and `initialize`
in one body, so `becomes` calls `new klass({}, block)` and turns the `new` half off by setting
`_suppressStiNewDispatch` and `_suppressAbstractCheck` on the class, restoring both in a `finally`
with an own-property test each. Those are the `try` and the two `if`s. `Base.allocate`
(`base.ts`, receipt `base-allocate-comes-from-a-ruby-compat-rb-obj-alloc`) does the same dance with
`_suppressInitializeCallback`.

The converged shape needs `Core#initialize` reachable on an allocated record, apart from the
constructor's `new` arm, so `becomes` reads `klass.allocate()` followed by the initialize call with
the block, and neither suppress flag is written.

## Acceptance criteria

- [ ] `becomes` is `klass.allocate()` plus the port of `became.send(:initialize) { |becoming| … }`,
      with no `try`, no `_suppressStiNewDispatch` / `_suppressAbstractCheck` write and no
      own-property restore.
- [ ] `_suppressStiNewDispatch` has no remaining writer; if `becomes` was its only one, the read in
      the `Base` constructor goes too.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` no longer lists
      `persistence.ts#becomes`.
- [ ] `packages/activerecord/src/persistence.test.ts` and `inheritance.test.ts` stay green, including
      `becomes` onto an STI subclass and onto a class whose scope attributes or column defaults name
      another subclass.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented
pnpm vitest run packages/activerecord/src/persistence.test.ts packages/activerecord/src/inheritance.test.ts
```
