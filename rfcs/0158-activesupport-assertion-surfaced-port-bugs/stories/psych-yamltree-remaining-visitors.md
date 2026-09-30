---
title: "psych-yamltree-remaining-visitors"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`activesupport-has-no-psych-emitter-for-to-yaml` ported Psych's dump pipeline
into `packages/activesupport/src/psych/` (`visitors/yaml-tree.ts`,
`tree-builder.ts`, `scalar-scanner.ts`, `psych.ts`'s `Psych.dump` / `toYaml`),
but only the visitors the HWIA ivars test needed, to fit the PR ceiling:
`visit_Hash` + `visit_hash_subclass`, `visit_String`, `visit_Symbol`,
`visit_Integer`, `visit_NilClass`. Any other value reaches the dispatch
`raise(TypeError, "Can't dump ...")` (`yaml_tree.rb:77`).

Still to port from `vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb`:

- `accept`'s `encode_with` arm: `dump_coder` / `emit_coder` (`:497-530`) and
  `Psych::Coder` (`psych/coder.rb`). trails already has `encodeWith(coder)` on
  `Column`, `SchemaCache`, `Arel::Nodes::SqlLiteral`, `Locking::Optimistic`,
  and `schema-cache.ts:41` hand-builds a `!ruby/object:` tag it could route
  through this.
- `visit_Array` / `visit_Enumerator` / `visit_array_subclass` (`:350-362`,
  `:418-450`), plus `TreeBuilder#start_sequence` / `end_sequence`
  (`tree_builder.rb:40-56`) which only they call.
- `visit_Object` (+ `alias visit_Delegator`) with `Psych.dump_tags`
  (`:152-165`, `psych.rb:742`) and `dump_ivars`' other callers.
- `visit_Float`, and `visit_TrueClass` / `visit_FalseClass` (aliases of
  `visit_Integer`, `:239-253`).
- `visit_Struct`, `visit_Exception` / `visit_NameError` / `dump_exception`,
  `visit_Regexp`, `visit_Date`, `visit_DateTime`, `visit_Time` /
  `format_time`, `visit_Rational`, `visit_Complex`, `visit_BigDecimal`,
  `visit_Module`, `visit_Class`, `visit_Range`, `visit_Psych_Set`,
  `visit_Psych_Omap`, `visit_Encoding`, `visit_BasicObject`.

## Acceptance criteria

- [ ] Each visitor above is ported into `psych/visitors/yaml-tree.ts` with
      Psych's names, branch order and tags, and `accept` dispatches
      `encode_with` receivers to `dumpCoder`.
- [ ] A `psych.trails.test.ts` case per visitor asserts the exact text Ruby
      3.3.11's `to_yaml` produces for the same value.
