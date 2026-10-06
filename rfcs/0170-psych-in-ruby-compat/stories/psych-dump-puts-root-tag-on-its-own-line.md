---
title: "Psych.dump puts a tagged root mapping's tag on its own line, not on the --- line"
status: draft
updated: 2026-10-06
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych.dump` of an object dumped through `encode_with` puts the document's
root tag on its own line:

```text
---
!ruby/object:ActionController::Parameters
parameters:
  key: :value
permitted: false
```

MRI's Psych emits the tag on the document-start line,
`--- !ruby/object:ActionController::Parameters`. The dump is
`packages/ruby-compat/src/psych.ts` `Psych.dump`, which is
`visitor.tree.toString({ directives: true })` over the node
`YAMLTree#emitCoder` builds
(`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`).

`vendor/rails/v8.0.2/actionpack/test/controller/parameters/serialization_test.rb:19`
asserts `assert_match("--- !ruby/object:ActionController::Parameters", yaml_dump)`.
`packages/actionpack/src/action-controller/controller/parameters/serialization.test.ts`
ports it as `/---\s!ruby\/object:ActionController::Parameters/` because of the
line break.

## Acceptance criteria

- [ ] `Psych.dump` of a tagged root mapping emits `--- !tag` on one line, as
      `ruby -ryaml -e` prints it, with a ruby-compat test pinning it.
- [ ] `serialization.test.ts`'s "YAML serialization" asserts the literal
      `"--- !ruby/object:ActionController::Parameters"` Rails asserts.
