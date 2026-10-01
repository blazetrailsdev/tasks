---
title: "activerecord: port the Symbol-citing exclusions and the send halves of the visibility ones; re-point the rest at the ratified section"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two reasons in the register that CLAUDE.md has since settled:

- private-method visibility — CLAUDE.md § "Method visibility is compile-time only" (trails#8317)
  ratifies that trails carries NO method visibility at run time: no side table, no
  `rbModPrivate`. A case whose assertions turn on a private method being refused is permanently
  unportable; a case that only `send`s a private method is portable, because `send` dispatches
  whatever is defined:
- `fixtures_test.rb` — "fixtures from root yml without instantiation"; "visibility of accessor method"; "without complete instantiation"
  reason: The mirror image of the row above: these assert the ABSENCE of those ivars under use_instantiated_fixtures = false, and that the accessor is private — defined?(@first), respond_to?(:topics, false) (fixtures_test.rb:756-7
- `associations/has_one_associations_test.rb` — "has one proxy should not respond to private methods"; "has one proxy should respond to private methods via send"
  reason: Ruby private-method visibility / `send` private dispatch on association proxies has no TypeScript runtime equivalent.
- `associations/has_one_through_associations_test.rb` — "has one through proxy should not respond to private methods"; "has one through proxy should respond to private methods via send"
  reason: Ruby private-method visibility / `send` private dispatch on association proxies has no TypeScript runtime equivalent.
  Per row:
  - `fixtures_test.rb` "visibility of accessor method" is already live in
    `packages/activerecord/src/fixtures.test.ts` (trails#8310): it reads
    `respond_to_missing?`'s `include_private` argument, which still flows through
    `rbObjRespondTo`'s `priv`. Its register row is stale and reds
    `scripts/parity/unported-live-test.test.ts`. The row's other two cases are ivar cases owned
    by `activerecord-port-fixtures-test-excluded-cases-lifecycle`.
  - "has one proxy should respond to private methods via send" and its has-one-through twin
    (`has_one_associations_test.rb:497-502`) port the way
    `belongs-to-associations.test.ts` "belongs to proxy should respond to private methods via
    send" already does.
  - "has one proxy should not respond to private methods" and its twin (`:492-495`,
    `assert_raise(NoMethodError) { ….private_method }`) stay in the register, as
    `belongs_to_associations_test.rb`'s does.
  - `attribute_methods_test.rb`'s four access-control cases and
    `core_ext/module_test.rb`'s five private-delegate cases were registered by trails#8317 and
    already cite the section. Nothing to do.
- Ruby Symbols — CLAUDE.md: a Ruby Symbol is a JS string, `":name"` where `Symbol ===` matters:
- `reflection_test.rb` — "symbol for class name"; "name error from incidental code is not converted to name error for association"; "automatic inverse does not suppress name error from incidental code"
  reason: Ruby Symbol type for class_name and const_missing hook for NameError discrimination have no JavaScript equivalent.
- `tasks/database_tasks_test.rb` — "raises an error when called with protected environment which name is a symbol"
  reason: Ruby Symbol env names (symbol→string coercion in protected_environments); env names are plain strings in TS.
- `database_configurations/resolver_test.rb` — "url missing scheme"
  reason: DIVERGES (documented): Rails parses every string config arg as a URL and raises InvalidConfigurationError for a bare `"foo"`; Trails treats non-URL strings as environment-name lookups (the role Ruby Symbols play in Rails

## Acceptance criteria

- [ ] Each Symbol case is ported with Rails' body and `":name"` symbols; its entry deleted.
- [ ] The two "…should respond to private methods via send" cases are ported with Rails' body; their names leave the register.
- [ ] The two "…should not respond to private methods" cases stay registered and skipped under a `PERMANENT-SKIP:` line, with the register reason citing CLAUDE.md § "Method visibility is compile-time only".
- [ ] The stale `fixtures_test.rb` "visibility of accessor method" entry is retired (the case is live), and `scripts/parity/unported-live-test.test.ts` no longer names it.
- [ ] No runtime visibility carrier is added: no `rbModPrivate`, side table, `#private` emulation or Proxy.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
