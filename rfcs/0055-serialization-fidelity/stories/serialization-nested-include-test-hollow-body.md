---
title: "Rewrite hollow activemodel 'nested include' test to mirror Rails test_nested_include"
status: draft
updated: 2026-06-15
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The activemodel `serialization.test.ts` `"nested include"` test
(packages/activemodel/src/serialization.test.ts:113-122) maps by name to Rails'
`test_nested_include` (vendor/rails/activemodel/test/cases/serialization_test.rb:154-160)
but is hollow: it passes NO `include:` option and only asserts `name`. Rails:

```ruby
def test_nested_include
  ...
  assert_equal expected, @user.serializable_hash(include: { friends: { include: :friends } })
end
```

The trails test never exercises nested includes at all. Per the
"never rename test names — fix the implementation/body to match Rails" rule,
the body should be rewritten to mirror Rails: a plural association with a
nested `include:` and an assertion on the recursively-nested structure
(see the existing `setAssociationAccessors` helper and the `friends`/`comments`
PORO patterns already in the file).

## Acceptance criteria

- `"nested include"` test passes `include: { friends: { include: :friends } }`
  (or the trails analog) and asserts the recursively-nested serialized shape.
- Test name unchanged (Rails-verbatim).
- No production code change expected (path already covered); if a real gap
  surfaces, converge to Rails.
