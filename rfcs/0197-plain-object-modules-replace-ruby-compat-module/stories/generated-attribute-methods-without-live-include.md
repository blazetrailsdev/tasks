---
title: "activemodel/activesupport: generated_attribute_methods without live include"
status: blocked
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9056
claim: "2026-10-19T12:08:29Z"
assignee: "activesupport-code-generator-method-sets-without-live-include"
blocked-by: "Repo owner ruled out a list of a module's includers (trails#9056); methods defined on generated_attribute_methods after the include need a carrier-free port the owner has yet to choose"
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-methods.ts:360` and
`packages/activesupport/src/current-attributes.ts:229` create
`generated_attribute_methods` as `new Module()`, include it at once, and
define attribute methods into it later. Rails:
`activemodel/lib/active_model/attribute_methods.rb` `generated_attribute_methods`,
`activesupport/lib/active_support/current_attributes.rb`.

## Acceptance criteria

- Each generated module is a plain-object module. Its methods are written to the
  including class at definition time with no carrier, and the Rails precedence
  is kept (a class body method outranks a generated one).
- activemodel attribute-method tests and current-attributes tests pass.
