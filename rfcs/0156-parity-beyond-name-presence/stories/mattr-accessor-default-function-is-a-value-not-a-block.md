---
title: "mattr-accessor-default-function-is-a-value-not-a-block"
status: draft
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`mattr_reader` / `mattr_writer` take `default:` as a VALUE and only a block is called:
`sym_default_value = (block_given? && default.nil?) ? yield : default`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/attribute_accessors.rb:69,134`).

trails' `setMattrDefault` (`packages/activesupport/src/module-ext.ts:53-63`) has no block
parameter and instead calls any function-valued `default` (`typeof rawDefault === "function" ?
rawDefault() : rawDefault`). So a Proc default cannot be passed as Rails passes it:
`cattr_accessor :field_error_proc, default: Proc.new { |html_tag, instance| ... }`
(`actionview/lib/action_view/base.rb:161`) had to be written as a thunk returning the function
(`packages/actionview/src/base.ts`, the `fieldErrorProc` `cattrAccessor.call`), and
`packages/actionview/src/helpers/form-helper.ts:932` passes `default: () => FormBuilder` the
same way.

## Acceptance criteria

- `mattrReader` / `mattrWriter` / `mattrAccessor` take the block as a trailing function
  argument (the settled trails block idiom) and store a function-valued `default` as the value,
  matching `attribute_accessors.rb:69,134`.
- `ActionView::Base.fieldErrorProc` passes the function itself as `default`
  (`base.rb:161`); `form-helper.ts:932` passes the block or the constant as Rails does.
- No call site relies on a function `default` being invoked.
