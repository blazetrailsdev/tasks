---
title: "ActiveModel alias-attribute method generation passes the host class where Rails passes a CodeGenerator"
status: done
updated: 2026-08-14
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6527
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails routes alias-attribute method generation through an
`ActiveSupport::CodeGenerator` batch. trails has no CodeGenerator port, so the
three ported methods pass the host CLASS where Rails passes the code generator,
which is what the RFC 0095 call-argument report flags as three `naming` rows on
`packages/activemodel/src/attribute-methods.ts`. Surfaced by the RFC 0096
activemodel naming burndown (PR #6350) and deliberately NOT renamed there — the
identifiers are not the defect, the missing collaborator is.

Rails (`activemodel/lib/active_model/attribute_methods.rb:211-226`):

```ruby
def eagerly_generate_alias_attribute_methods(new_name, old_name) # :nodoc:
  ActiveSupport::CodeGenerator.batch(generated_attribute_methods, __FILE__, __LINE__) do |code_generator|
    generate_alias_attribute_methods(code_generator, new_name, old_name)
  end
end

def generate_alias_attribute_methods(code_generator, new_name, old_name) # :nodoc:
  ActiveSupport::CodeGenerator.batch(code_generator, __FILE__, __LINE__) do |owner|
    attribute_method_patterns.each do |pattern|
      alias_attribute_method_definition(code_generator, pattern, new_name, old_name)
    end
    attribute_method_patterns_cache.clear
  end
end

def alias_attribute_method_definition(code_generator, pattern, new_name, old_name) # :nodoc:
```

`define_attribute_methods` (`attribute_methods.rb:273-281`) likewise yields an
`owner` from the batch and passes it as `generate_alias_attribute_methods owner, aliased_name, attr_name`.

trails today (`packages/activemodel/src/attribute-methods.ts:289,297,307,378`)
declares the first parameter as `host: AttributeMethodHost` and passes `this` /
the host class instead.

Note `attribute_method_patterns_cache.clear` inside the batch — trails'
`generateAliasAttributeMethods` does not clear it. Check whether that is a
second gap while you are in the method.

## Converged shape

Port `ActiveSupport::CodeGenerator` (`activesupport/lib/active_support/code_generator.rb`)
— or establish that its batching is a Ruby `class_eval`-string optimisation with
no TS analogue and therefore belongs in `SKIP_GROUPS` with a reason — then take
`codeGenerator` / `owner` as the first parameter of the three methods above so
the Rails argument and its name both land.

If the conclusion is that no TS analogue exists, that decision must be recorded
in `scripts/parity/conventions.ts`' `SKIP_GROUPS` with the reason, NOT left as
three unexplained call-argument rows.

## Acceptance criteria

1. `eagerlyGenerateAliasAttributeMethods`, `generateAliasAttributeMethods` and
   `aliasAttributeMethodDefinition` take Rails' first argument under Rails' name,
   or the absence of a CodeGenerator port is recorded in `SKIP_GROUPS` with a
   reason.
2. The three `naming` rows for `activemodel/attribute-methods.ts` in
   `pnpm parity:api:calls:args:report` are gone; report before/after.
3. `attribute_method_patterns_cache.clear` is either present or filed separately.
4. No behavior change to `aliasAttribute` / `defineAttributeMethods`.
