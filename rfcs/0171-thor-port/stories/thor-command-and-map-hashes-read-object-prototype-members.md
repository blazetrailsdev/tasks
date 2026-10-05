---
title: "Thor commands / all_commands / map read Object.prototype members as entries"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base::ClassMethods#commands` / `#all_commands` (`vendor/thor/v1.3.2/lib/thor/base.rb:482-497`) and `Thor.map` (`vendor/thor/v1.3.2/lib/thor.rb:101-120`) are Ruby Hashes, so `all_commands["constructor"]` and `map["toString"]` are `nil`.

The ports hold them as plain objects created with `{}` (`packages/trailties/src/thor/base.ts` `commands` / `allCommands`, `packages/trailties/src/thor/thor.ts` `map`), so a key that names an `Object.prototype` member reads that member:

- `Thor.dispatch` (`thor.rb:507`, `thor.ts` `dispatch`) reads `this.allCommands()[this.normalizeCommandName(meth)]`. `thor constructor` finds `Object`, treats it as a command, and fails with a `TypeError` where Thor builds a `DynamicCommand` and raises `UndefinedCommandError`.
- `retrieve_command_name` (`thor.rb:594`) and `normalize_command_name` (`thor.rb:613`) read `map[meth]`, which is truthy for `toString`, `valueOf`, `hasOwnProperty`.
- `find_command_possibilities` (`thor.rb:628-629`) reads `map[k]` the same way.

Found while porting `port-thor-dispatch-and-help` (trails#8509); not introduced there.

## Acceptance criteria

- [ ] `commands`, `all_commands` and `map` hold no inherited keys (a null-prototype object or a `Map`, matching how the rest of the thor port spells a Ruby Hash), so a lookup of an `Object.prototype` member name answers `nil`.
- [ ] `Thor.start(["constructor"])` raises `UndefinedCommandError`, and `["toString"]` is not treated as a mapped command. Covered in `thor.trails.test.ts`.
