---
title: "activemodel-code-generator-port"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6527
claim: "2026-08-14T15:47:02Z"
assignee: "activemodel-code-generator-port"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-methods.ts` has no port of
`ActiveSupport::CodeGenerator`. Where Rails threads a `code_generator`,
trails threads `host` — the class the methods land on:

- `eagerly_generate_alias_attribute_methods` (`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:211-215`)
  wraps the body in `ActiveSupport::CodeGenerator.batch(generated_attribute_methods, __FILE__, __LINE__)`
  and passes the yielded `code_generator` on; trails calls
  `generateAliasAttributeMethods(host, newName, oldName)` with no batch at all.
- `generate_alias_attribute_methods` (attribute_methods.rb:217-224) opens a
  second `CodeGenerator.batch(code_generator, ...)`, iterates
  `attribute_method_patterns`, and — crucially — clears
  `attribute_method_patterns_cache` at the end. trails' loop (attribute-methods.ts:293-301)
  has neither the batch nor the cache clear.
- `define_attribute_methods`'s `generate_alias_attribute_methods(owner, ...)`
  passes the batch owner; trails passes `this`.

trails' `packages/activerecord/src/attribute-methods.ts` carries the identical
shape (owned by `naming-burndown-3-ar-model-encryption-tasks`), so a
CodeGenerator port converges both.

This is an a3, not a rename — surfaced by RFC 0096 wave 3
(`naming-burndown-3-arel-activemodel`), where it keeps 3 `naming`
call-argument rows standing in activemodel plus 1 in activerecord.

## Acceptance criteria

- [ ] Either `ActiveSupport::CodeGenerator` is ported and the three
      `attribute_methods.rb` sites thread it under the Rails name
      `codeGenerator`, or the absence is justified at the call site as a
      language shortcoming with the Rails `file:line`.
- [ ] `generateAliasAttributeMethods` clears the attribute-method-pattern cache
      as attribute_methods.rb:222 does, or the omission is filed separately.
- [ ] `pnpm parity:api:calls:args:report` shows the four `naming` rows retired,
      with no new `shape` rows.
