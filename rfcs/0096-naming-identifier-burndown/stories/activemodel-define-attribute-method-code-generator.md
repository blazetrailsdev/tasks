---
title: "activemodel-define-attribute-method-code-generator"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6538
claim: "2026-08-14T18:57:42Z"
assignee: "activemodel-define-attribute-method-code-generator"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::CodeGenerator` is ported at
`packages/activesupport/src/code-generator.ts` and threaded through the
alias-attribute half of `packages/activemodel/src/attribute-methods.ts`
(story `activemodel-code-generator-port`, RFC 0096). The non-alias half is
still unthreaded:

- `define_attribute_methods` (attribute_methods.rb:275) passes
  `_owner: owner` into `define_attribute_method`; the port calls
  `defineAttributeMethod(this, attrName)` with no owner, so the batch this
  method now opens does not cover pattern generation.
- `define_attribute_method` (attribute_methods.rb:311-318) opens its own
  `CodeGenerator.batch(_owner, ...)`, takes `as: attr_name`, and clears
  `attribute_method_patterns_cache` at the end. The port
  (`defineAttributeMethod`, attribute-methods.ts:419-425) does none of it.
- `define_attribute_method_pattern` (attribute*methods.rb:320-347) takes
  `owner:`/`as:`, computes `canonical_method_name` vs `public_method_name`,
  guards on `instance_method_already_implemented?(public_method_name)`, and
  dispatches to `define_method*#{pattern.proxy_target}`when the class
defines one, else`define_proxy_call(owner, …)`. The port
(attribute-methods.ts:427-443) has no `owner`/`as`, guards on
`host.prototype[methodName] !== undefined`, and defines straight onto
`generatedAttributeMethods`.

Two `shape` rows in `call-arg-mismatches` stand on this
(`define_attribute_methods` → `define_attribute_method`,
`define_attribute_method` → `define_attribute_method_pattern`), plus the
`define_proxy_call` / `define_call` entry in
`scripts/api-compare/arity-exclude.json` whose stated reason is "trails has no
eval/code generation" — no longer true.

## Acceptance criteria

- [ ] `defineAttributeMethod` takes `{ _owner, as }`, opens
      `CodeGenerator.batch`, and clears the pattern cache, per
      attribute_methods.rb:311-318.
- [ ] `defineAttributeMethodPattern` takes `owner`/`as` and defines through
      the generator; `defineProxyCall` / `defineCall` thread `codeGenerator`
      and the `namespace:`/`as:` kwargs as attribute_methods.rb:407-443 does.
- [ ] The two `shape` rows above are retired, and the `define_proxy_call` /
      `define_call` arity-exclude entry is deleted or its reason corrected.
