---
title: "CLASS_METHOD_TABLE and OBJECT_METHOD_TABLE answer respond_to? and send alike"
status: draft
updated: 2026-10-06
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

`packages/ruby-compat/src/object.ts` has three tables for methods a package
defines by reopening a core class: `OBJECT_METHOD_TABLE`,
`ENUMERABLE_METHOD_TABLE` and, since trails#8574, `CLASS_METHOD_TABLE`. They are
not consulted symmetrically.

- `CLASS_METHOD_TABLE` is read by `basicObjRespondTo` only. `rbFSend` /
  `rbFPublicSend` (`sendInternal`) do not dispatch from it, so
  `rbObjRespondTo(klass, "classAttribute")` is true while
  `rbFSend(klass, "classAttribute", "x")` raises `NoMethodError`. In Ruby a
  method `respond_to?` answers for is one `send` reaches
  (`vendor/ruby/v3.3.11/vm_method.c:2864` `basic_obj_respond_to`,
  `vm_eval.c:1330` `rb_f_send`).
- `OBJECT_METHOD_TABLE` is the reverse: `sendInternal` dispatches from it and
  `basicObjRespondTo` does not answer for it, so `3.respond_to?(:in?)` is false
  here and true in Ruby with ActiveSupport loaded
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/inclusion.rb:15`).

`ENUMERABLE_METHOD_TABLE` is read by both and is the shape to match.

## Acceptance criteria

- `sendInternal` dispatches a `CLASS_METHOD_TABLE` entry for a class receiver
  whose own chain defines none.
- `basicObjRespondTo` answers for an `OBJECT_METHOD_TABLE` entry.
- `object.trails.test.ts` covers both directions for both tables.
