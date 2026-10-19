---
title: "ruby-compat: rbModConstSet names a defineModule-built plain module"
status: draft
updated: 2026-10-19
rfc: "0000-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rb_mod_const_set` (`vendor/ruby/v3.3.11/object.c:2545`, `variable.c:3648-3668`)
names a module bound to a constant. `rbModConstSet`
(`packages/ruby-compat/src/include.ts:88`) paths only a `Module` or a class.
A plain-object namespace gets no classpath, so Marshal and YAML can't name it:
`packages/ruby-compat/src/marshal.trails.test.ts:42` (`Geo::Kind`) and
`psych-to-yaml.test.ts:12` (`YAMLSpecs`). `defineModule` already stamps
`moduleVisibility` (`include.ts`, `export function defineModule`).

## Acceptance criteria

- `rbModConstSet` paths a value carrying the `defineModule` stamp. `rbModName`,
  `rbModToS` and `rbInspect` render its path.
- Marshal dumps and loads such a module by name (`marshal.ts:372,647,1065`).
- The two test sites above use `defineModule` instead of `new Module()`.
