---
title: "ruby-compat: a class module records the modules it includes"
status: in-progress
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["ruby-compat", "actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9056
claim: "2026-10-19T12:08:29Z"
assignee: "activesupport-code-generator-method-sets-without-live-include"
blocked-by: null
closed-reason: null
---

## Context

`include(plainModule, other)` records `other` (trails#9050,
`packages/ruby-compat/src/include.ts` `moduleIncludesKey`), and
`rbModAppendFeatures` appends the recorded modules first, as `include_modules_at`
(`vendor/ruby/v3.3.11/class.c:1253`) does. A class module is a function, so
`include(ClassModule, other)` takes the class path and copies `other`'s methods
onto `ClassModule.prototype`. That flattens the ancestry: an includer of
`ClassModule` does not report `other` as included. This blocks `FormHelper`
(`packages/actionview/src/helpers/form-helper.ts`), which includes the
non-Concern `ModelNaming` and `RecordIdentifier` (Rails
`actionview/lib/action_view/helpers/form_helper.rb:35-38`).

## Acceptance criteria

- A class module can be marked as a module (not an ordinary class), and
  `include()` into it records rather than copies, as for a plain module.
- `rbModAppendFeatures` and `Module#include` follow the record for class modules.
- `FormHelper` is converted.
- ruby-compat tests cover the record for both shapes.
