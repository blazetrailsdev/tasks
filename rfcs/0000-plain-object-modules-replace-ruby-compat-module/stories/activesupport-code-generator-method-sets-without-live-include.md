---
title: "activesupport: CodeGenerator method sets without live include"
status: draft
updated: 2026-10-19
rfc: "0000-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/code-generator.ts:23` caches one `new Module()` per
namespace (`MethodSet::METHOD_CACHES`, Rails
`activesupport/lib/active_support/code_generator.rb`), and defines methods into
it after it has been included.

## Acceptance criteria

- The cache is a plain-object module whose methods exist before `apply`
  includes it, or are written to the owner directly, as Rails'
  `code_generator.rb` `apply` does with `define_method`.
- No `new Module` remains in `code-generator.ts`.
