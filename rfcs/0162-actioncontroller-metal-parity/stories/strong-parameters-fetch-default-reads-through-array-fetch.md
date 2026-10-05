---
title: "Parameters#fetch reads its default through Array#fetch"
status: closed
updated: 2026-10-05
rfc: "0162-actioncontroller-metal-parity"
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
closed-reason: "shipped in trails#8558: ruby-compat aryFetch ports rb_ary_fetch and Parameters#fetch calls it"
---

## Context

Rails' `ActionController::Parameters#fetch`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:820-831`) reads its
default with `args.fetch(0) { raise ActionController::ParameterMissing.new(key, @parameters.keys) }`,
which is `Array#fetch` with a block (`rb_ary_fetch`, `vendor/ruby/v3.3.11/array.c`).

ruby-compat has no `Array#fetch`. Its `fetch` (`packages/ruby-compat/src/hash.ts`) is `Hash#fetch` only.
So trails' port (`packages/actionpack/src/action-controller/metal/strong-parameters.ts`, `fetch`,
shipped in trails#8558) writes that call as `if (args.length > 0) return args[0];` followed by the
`throw`. That is an `if` arm Rails does not have, and it carries an
`@inventedArm if — CONVERGEABLE` receipt naming this story.

## Acceptance criteria

- [ ] ruby-compat ports `Array#fetch` (`rb_ary_fetch`): the index arm, the default arm, the block arm,
      and the `IndexError` arm, each with its MRI citation.
- [ ] `Parameters#fetch` calls it as `args.fetch(0) { raise ... }` does, and the invented `if` is gone.
- [ ] The `@inventedArm if` receipt on `Parameters#fetch` is deleted.
