---
title: "rbFRequireFile registers a required command module twice, so Command lookup inlines a load-path search"
status: draft
updated: 2026-11-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Behavior.lookup` / `lookup!` (`vendor/rails/v8.0.2/railties/lib/rails/command/behavior.rb:43,59`) `require` each command file. trails#9927 first ported that call as ruby-compat's `rbFRequireFile` (`packages/ruby-compat/lib/load.ts`). Every command class then appeared twice in `subclasses()`: `lookupBang` listed `DevCommand`, `DevCommand`, and so on. `loadIseqEval(path)` (the non-fresh arm) does not duplicate them. So `packages/trailties/lib/command/behavior.ts` now searches `LOAD_PATH` inline and calls `loadIseqEval`, where Rails calls `require`. Nobody has explained the doubling. The suspects are `rbFLoad`'s `constSet(TopLevel, id, val)` seating, and the `fresh` re-import URL under vitest.

## Acceptance criteria

- [ ] Find why `rbFRequireFile` registers each command module twice, and fix it in ruby-compat.
- [ ] `lookup` / `lookupBang` call `rbFRequireFile(path)` with the relative feature (the `delete_prefix` shape at `behavior.rb:58`), and the inline `LOAD_PATH` search loop is deleted.
- [ ] `test/command.trails.test.ts` "hides unused_routes from the program" still lists each hidden command once.
