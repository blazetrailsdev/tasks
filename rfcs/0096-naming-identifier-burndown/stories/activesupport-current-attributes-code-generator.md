---
title: "activesupport-current-attributes-code-generator"
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

`ActiveSupport::CodeGenerator` is now ported at
`packages/activesupport/src/code-generator.ts` (PR for
`activemodel-code-generator-port`, RFC 0096), and
`activemodel/attribute-methods.ts` threads it through the alias-attribute
generation path.

`current_attributes.rb:118-135` threads it too:

```ruby
def attribute(*names, default: NOT_SET)
  ...
  ActiveSupport::CodeGenerator.batch(generated_attribute_methods, __FILE__, __LINE__) do |owner|
    names.each do |name|
      owner.define_cached_method(name, namespace: :current_attributes) do |batch|
      ...
      owner.define_cached_method("#{name}=", namespace: :current_attributes) do |batch|
```

`packages/activesupport/src/current-attributes.ts`'s `attribute` still defines
the readers/writers directly, with no batch and no
`generatedAttributeMethods` module. The omission was invisible to the
call-set gate until `batch` existed as a ported name; it is now carried as a
baseline row in
`scripts/api-compare/call-mismatches-exclude/activesupport/current-attributes.json`
(`attribute` → `batch`), which this story retires by converging the body.

## Acceptance criteria

- [ ] `attribute` wraps its definitions in `CodeGenerator.batch(...)` and
      defines each reader/writer through `defineCachedMethod(name,
{ namespace: "current_attributes" }, ...)`, mirroring
      current_attributes.rb:118-135.
- [ ] The `attribute` → `batch` row is deleted from
      `call-mismatches-exclude/activesupport/current-attributes.json` (and the
      shard mark tightened with `pnpm parity:api:calls:tighten`).
- [ ] `pnpm vitest run packages/activesupport/src/current-attributes.test.ts` passes.
