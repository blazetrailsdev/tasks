---
title: "generator_dir passes regular_class_path to File.join the way Rails does, Array-splicing an empty one"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 47
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::GeneratorGenerator#generator_dir`
(`railties/lib/rails/generators/rails/generator/generator_generator.rb:18-24`) is

```ruby
def generator_dir
  if options[:namespace]
    File.join("lib", "generators", regular_class_path, file_name)
  else
    File.join("lib", "generators", regular_class_path)
  end
end
```

`regular_class_path` is an **Array** (`named_base.rb`), and `File.join` splices
an empty one away — `File.join("lib", "generators", [], "x")` is
`"lib/generators/x"`, not `"lib/generators//x"`.

`packages/trailties/src/generators/rails/generator/generator-generator.ts:46-51`
has a String `regularClassPath()` instead, so it cannot pass it to `File.join`
without producing a doubled separator when it is empty, and builds a segment
array by hand:

```ts
const parts = ["lib", "generators"];
if (this.regularClassPath()) parts.push(this.regularClassPath());
if (namespace) parts.push(this.fileName);
return parts.join("/");
```

PR #7462 baselined the call-argument row
(`trailties/generators/rails/generator/generator-generator.json`,
`join(str:lib, str:generators, ref:regularClassPath, ref:fileName)`) when `File`
left `CORE_CLASS_RECEIVERS`. The root cause is the String-vs-Array shape of
`regularClassPath`, not the join.

## Acceptance criteria

- Either `regularClassPath()` answers an Array the way Rails' does, or
  `File.join` learns Ruby's Array-splicing arm (`vendor/ruby/file.c:5013`
  `rb_file_join` recurses into an Array element and drops an empty one) — decide
  which by checking what the other `regular_class_path` call sites in
  `packages/trailties/src/generators/` need, and say so in the PR.
- `generator_dir` is the two-arm `if options[:namespace]` shape with both
  `File.join` calls spelled as Rails spells them, and the hand-built `parts`
  array is deleted.
- The `join(...)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/trailties/generators/rails/generator/generator-generator.json`
  (only-shrink: delete by hand, no reseed) and `pnpm parity:api:calls:args` is green.
- Rails' `generator_generator_test.rb` cases covering the namespaced and
  non-namespaced paths are ported with their names verbatim, including the
  empty-`regular_class_path` case that is the whole reason the shapes differ.
