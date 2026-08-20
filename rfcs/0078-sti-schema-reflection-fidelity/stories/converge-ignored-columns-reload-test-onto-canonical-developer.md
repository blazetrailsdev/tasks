---
title: "Converge the ignored-columns reload test onto Rails' canonical Developer"
status: done
updated: 2026-08-20
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6707
claim: "2026-08-18T15:49:44Z"
assignee: "sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

Surfaced closing `declared-attribute-default-seeds-initialized-not-uninitialized`
(PR #6702, RFC 0078).

Rails' `base_test.rb:1825-1834`:

```ruby
test "when #reload called, ignored columns' attribute methods are not defined" do
  developer = Developer.create!(name: "Developer")
  assert_not_respond_to developer, :first_name
  developer.reload
  assert_not_respond_to developer, :first_name
end
```

It uses the canonical `Developer`, whose `ignored_columns` are REAL columns
(`first_name`, `last_name`) with no `attribute()` declaration. Such a column is
absent from `types`, so `LazyAttributeSet#default_attribute`
(`activemodel/lib/active_model/attribute_set/builder.rb:81-89`) lands on
`Attribute.null` and it stays out of `@attributes`.

trails' port (`packages/activerecord/src/base.test.ts`, "when #reload called,
ignored columns' attribute methods are not defined") instead declares a bespoke
local `class User extends Base` with `attribute("name")`, `attribute("secret")`
and `ignoredColumns = ["secret"]` — a column both DECLARED and IGNORED, a shape
Rails' test never exercises. In Rails that shape keeps the slot: the declared
name IS in `types` and `default_attribute` dups its initialized default
(`Attribute::Null#with_type` → `with_cast_value`, `attribute.rb:231-233`). The
trails-only `_ignoredColumns` loop in `narrowToProjectedColumns`
(`packages/activerecord/src/inheritance.ts`, ~line 573) exists only to satisfy
that bespoke shape.

## Converged shape

- The test uses the canonical `Developer` from
  `test-helpers/models/developer.ts` and its real ignored columns, matching
  `base_test.rb:1825-1834` line for line. No bespoke local model.
- With no test depending on the declared-and-ignored shape, delete the
  `_ignoredColumns` narrowing loop in `narrowToProjectedColumns` and its comment;
  the `columnNames()`-derived `narrowable` list is what Rails' behaviour needs.
- Test name unchanged (`parity:test` matches on it).

## Acceptance criteria

- [ ] The trails test body mirrors Rails', using the canonical `Developer`.
- [ ] `narrowToProjectedColumns`'s ignored-column loop is gone, or its retention
      is justified by a Rails citation rather than by the bespoke test.
- [ ] `base.test.ts`, `inheritance*.test.ts` green on all three adapters;
      `parity:test` delta >= 0.
