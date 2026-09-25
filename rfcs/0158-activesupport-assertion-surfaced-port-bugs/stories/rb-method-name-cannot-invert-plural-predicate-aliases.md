---
title: "rbMethodName renders PLURAL_PREDICATE_ALIASES as has_x? instead of x?"
status: draft
updated: 2026-09-25
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

Surfaced by trails#8080. `rbMethodName` (`packages/ruby-compat/src/symbol.ts`) inverts the trails member-name conventions so `DeprecatedInstanceVariableProxy#warn` (`activesupport/lib/active_support/deprecation/proxy_wrappers.rb:101`) can render the Ruby Symbol `method_missing` would have received.

It renders a verb-led `hasX` as `has_x?`. That is correct for `HAS_PREDICATE_ALIASES` (`hasKey` → `has_key?`, a real Ruby alias of `key?`). It is wrong for `PLURAL_PREDICATE_ALIASES` (`scripts/parity/conventions.ts:1488-1507`): `hasActiveConnections` is the spelling of `active_connections?`, but it renders as `has_active_connections?`, a name Ruby does not define. The 18-row table lives in `scripts/`, which ruby-compat cannot import.

## Converged shape

Move the plural-predicate table into a module both `scripts/parity/conventions.ts` and ruby-compat can import (for example a ruby-compat export that conventions.ts re-reads). Make `rbMethodName` map those spellings back to their bare `x?` name.

## Acceptance criteria

- [ ] `rbMethodName("hasActiveConnections")` is `"active_connections?"`, and `rbMethodName("hasKey")` stays `"has_key?"`.
- [ ] conventions.ts and ruby-compat read the same table, with no copy.
