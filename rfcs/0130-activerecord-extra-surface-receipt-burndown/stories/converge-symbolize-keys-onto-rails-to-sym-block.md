---
title: "symbolize_keys drops Rails' to_sym block and is the identity"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Hash#symbolize_keys`
(`activesupport/lib/active_support/core_ext/hash/keys.rb:27-29`) is

```ruby
def symbolize_keys
  transform_keys { |key| key.to_sym rescue key }
end
alias_method :to_options, :symbolize_keys
```

trails' (`packages/activesupport/src/hash-utils.ts:125`) is

```ts
export function symbolizeKeys<T extends AnyObject>(obj: T): Record<string, unknown> {
  return transformKeys(obj, (key) => key);
}
```

— the **identity**. The block Rails passes is the whole method, and trails
drops it, so `symbolizeKeys` and `stringifyKeys` differ only in return type.
`symbolizeKeysBang` (`:129`) and `deepSymbolizeKeys` have the same hole, as
does `toOptions` (`:137`), which is the alias at `keys.rb:30`.

CLAUDE.md's settled spelling for a Ruby Symbol is the leading-colon string
(`":id"`), and `rbInspect` already honours it — `inspectValue`
(`packages/ruby-compat/src/object.ts`) returns an `isSymbol` string verbatim,
so `rbInspect({ ":id": false })` renders `{:id=>false}` today. So `key.to_sym`
has a trails spelling; it is simply not applied.

Surfaced by trails#7727. That PR needed the Symbol spelling at four AR sites
that inspect an options hash and, with no working `symbolizeKeys` to reach
for, inlined the transform at each:

- `formatArguments` (`packages/activerecord/src/migration.ts`,
  `activerecord/lib/active_record/migration.rb:1154-1163`)
- `foreignKeyForBang` / `checkConstraintForBang`
  (`connection-adapters/abstract/schema-statements.ts`,
  `connection_adapters/abstract/schema_statements.rb`)
- `exclusionConstraintForBang` / `uniqueConstraintForBang`
  (`connection-adapters/postgresql/schema-statements.ts`,
  `connection_adapters/postgresql/schema_statements.rb`)

each spelled

```ts
rbInspect(Object.fromEntries(Object.entries(options).map(([k, v]) => [":" + k, v])));
```

That is four copies of a transform Rails has as one method, and the sibling
story `inspect-option-hashes-with-ruby-symbol-keys` already rules it out in
its acceptance criteria ("not a per-call-site transform"). Converging
`symbolizeKeys` is what lets those four collapse.

## Converged shape

`symbolizeKeys` becomes

```ts
transformKeys(obj, (key) => ":" + key);
```

— Ruby's `key.to_sym`, in the repo's Symbol spelling — with the `rescue key` arm
carried as the non-coercible case, and `symbolizeKeysBang` /
`deepSymbolizeKeys` / `toOptions` following it.

The blast radius is the reason this is its own story rather than a line:
21 call sites read `symbolizeKeys` / `deepSymbolizeKeys` today and every one
of them currently receives bare keys. Each has to be checked for whether it
wants the Ruby Symbol (a value being rendered or compared against a Symbol)
or the bare JS key (a property lookup) — `HashWithIndifferentAccess#symbolizeKeys`
(`hash-with-indifferent-access.ts:432`) and
`DatabaseConfigurations` (`activerecord/src/database-configurations.ts:253`)
are the two that most likely want different things.

## Acceptance criteria

- `symbolizeKeys`, `symbolizeKeysBang`, `deepSymbolizeKeys` and `toOptions`
  apply Rails' block rather than the identity, at `keys.rb:27-37`.
- Every one of the 21 call sites is audited and lands on the spelling it
  actually wants; the choice is recorded where it is not obvious.
- The four inline transforms listed above collapse onto it, closing that half
  of `inspect-option-hashes-with-ruby-symbol-keys`.
- `pnpm parity:api:calls` / `:calls:args` gain no rows.
