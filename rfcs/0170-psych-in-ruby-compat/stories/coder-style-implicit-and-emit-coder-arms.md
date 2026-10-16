---
title: "Psych::Coder style/implicit/scalar/object; emit_coder ports all four arms"
status: draft
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych::Coder` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/coder.rb`) carries `style`, `implicit`, `scalar` and `object`, and `YAMLTree#emit_coder` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:510-530`) passes `c.style` / `c.implicit` to `start_sequence` / `start_mapping`, and has `:scalar` and `:object` arms. trails' `packages/ruby-compat/src/psych/coder.ts` has none of these, so `emitCoder` in `psych/visitors/yaml-tree.ts` passes `Sequence.BLOCK` / `Mapping.BLOCK` and `c.tag === null` for implicit, and handles only `:seq` and map.

## Acceptance criteria

- `Coder` ports `style`, `implicit`, `scalar`, `object` and their setters per `coder.rb`.
- `emitCoder` follows `yaml_tree.rb:510-530` with all four `case c.type` arms.
- A test pins a coder `scalar` / `represent_object` dump against `ruby -ryaml`.
