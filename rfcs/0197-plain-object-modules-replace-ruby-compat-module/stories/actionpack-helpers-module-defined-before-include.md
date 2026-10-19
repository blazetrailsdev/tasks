---
title: "actionpack: helpers module populated without live include"
status: ready
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["actionpack"]
deps: ["class-modules-record-module-includes"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/abstract-controller/helpers.ts:164` (`_helpers = new
Module()`) and `:192` (`defineHelpersModule`) port Rails'
`abstract_controller/helpers.rb` `_helpers` / `HelperMethods` module, which
`helper` / `helper_method` populate with `module_eval` after it has been
included into the view class. This relies on Ruby's shared method table
(`rb_include_module`, `vendor/ruby/v3.3.11/class.c:1179`).

## Acceptance criteria

- `_helpers` is a plain-object module. Each method is defined before any class
  includes the module, or is written to every class that has already included
  it, with no carrier and no re-splice.
- The PR body states which of the two each call path takes, with the Rails
  `file:line` of the include site.
- The actionpack helper and controller tests pass.
