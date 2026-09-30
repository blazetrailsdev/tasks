---
title: "activerecord: port the 12 exclusions citing method visibility or Ruby Symbols"
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

- private-method visibility — CLAUDE.md § "Method visibility is a side table" (`rbModPrivate`,
  `rbFPublicSend`) now carries it:
- `fixtures_test.rb` — "fixtures from root yml without instantiation"; "visibility of accessor method"; "without complete instantiation"
  reason: The mirror image of the row above: these assert the ABSENCE of those ivars under use_instantiated_fixtures = false, and that the accessor is private — defined?(@first), respond_to?(:topics, false) (fixtures_test.rb:756-7
- `associations/has_one_associations_test.rb` — "has one proxy should not respond to private methods"; "has one proxy should respond to private methods via send"
  reason: Ruby private-method visibility / `send` private dispatch on association proxies has no TypeScript runtime equivalent.
- `associations/has_one_through_associations_test.rb` — "has one through proxy should not respond to private methods"; "has one through proxy should respond to private methods via send"
  reason: Ruby private-method visibility / `send` private dispatch on association proxies has no TypeScript runtime equivalent.
- Ruby Symbols — CLAUDE.md: a Ruby Symbol is a JS string, `":name"` where `Symbol ===` matters:
- `reflection_test.rb` — "symbol for class name"; "name error from incidental code is not converted to name error for association"; "automatic inverse does not suppress name error from incidental code"
  reason: Ruby Symbol type for class_name and const_missing hook for NameError discrimination have no JavaScript equivalent.
- `tasks/database_tasks_test.rb` — "raises an error when called with protected environment which name is a symbol"
  reason: Ruby Symbol env names (symbol→string coercion in protected_environments); env names are plain strings in TS.
- `database_configurations/resolver_test.rb` — "url missing scheme"
  reason: DIVERGES (documented): Rails parses every string config arg as a URL and raises InvalidConfigurationError for a bare `"foo"`; Trails treats non-URL strings as environment-name lookups (the role Ruby Symbols play in Rails

## Acceptance criteria

- [ ] Each case is ported with Rails' body through `rbModPrivate` / `send` / `publicSend` and `":name"` symbols; entries deleted.
- [ ] Any case that turns on `topic.title` raising (not `send`) stays with `activerecord-private-attribute-methods-are-still-public` (RFC 0155) and names it.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
