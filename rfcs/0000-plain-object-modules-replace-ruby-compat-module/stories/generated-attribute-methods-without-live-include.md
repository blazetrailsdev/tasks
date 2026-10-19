---
title: "activemodel/activesupport: generated_attribute_methods without live include"
status: draft
updated: 2026-10-19
rfc: "0000-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
