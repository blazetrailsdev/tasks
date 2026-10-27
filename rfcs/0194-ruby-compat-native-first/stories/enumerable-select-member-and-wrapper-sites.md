---
title: "ruby-compat: Enumerable#select member and its wrapper sites"
status: in-progress
updated: 2026-10-27
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9386
claim: "2026-10-27T20:08:43Z"
assignee: "call-gate-credits-filter-length-count-and-nested-native-forms"
blocked-by: null
closed-reason: null
---

## Context

`new Enumerable(x)` (`packages/ruby-compat/src/enumerable.ts`) has `findAll` but no `select` / `filter` member, so a Rails `set.select { }` / `hash.select { }` cannot be spelled through the wrapper, and the call gates cannot credit `select`. trails#9329 left the `select` sites unconverted for this reason. Ruby's `Enumerable#select` is `enum_find_all` aliased (`vendor/ruby/v3.3.11/enum.c`, `Init_Enumerable`).

## Acceptance criteria

- `Enumerable#select` (and the free function) as the `find_all` alias, with the blockless arm answering `enumToA` like `reject`.
- Re-grep the actionpack/actionview/activerecord/trailties/activemodel candidates from the three `enumerable-wrapper-adoption-*` stories for Rails `select` on a Set or Hash receiver, and convert them to `new Enumerable(x).select(...)`.
- `parity:api:calls` / `parity:api:calls:args` green.
