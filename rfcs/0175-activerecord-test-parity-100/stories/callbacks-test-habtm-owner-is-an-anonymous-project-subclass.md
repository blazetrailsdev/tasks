---
title: "activerecord: callbacks_test habtm before_add owner is an anonymous Project subclass, not a bespoke registered class"
status: draft
updated: 2026-10-09
rfc: "0175-activerecord-test-parity-100"
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

`packages/activerecord/src/associations/callbacks.test.ts`, "has and belongs to many before add called before save", builds its owner as a bespoke `class ProjectWithCallback extends Base` with `tableName = "projects"`, a hand-declared `name` attribute, explicit `joinTable` / `foreignKey` / `associationForeignKey` options, and a `registerModel(ProjectWithCallback)` seat.

Rails (`vendor/rails/v8.0.2/activerecord/test/cases/associations/callbacks_test.rb:124-143`) builds it as an anonymous subclass of the canonical model that answers the canonical name:

```ruby
klass = Class.new(Project) do
  def self.name; Project.name; end
  has_and_belongs_to_many :developers_with_callbacks,
                            class_name: "Developer",
                            before_add: lambda { |o, r| ... }
end
rec = klass.create!
```

so the join table, keys and the middle reflection's `class_name` (`"#{lhs_model.name}::#{join_model.name}"`, `associations/builder/has_and_belongs_to_many.rb`) all derive from `Project`, and nothing is registered.

## Converged shape

The owner is `class extends Project` whose `name` answers `Project.name`, declaring only `className: "Developer"` and `beforeAdd`, created with `klass.create()` and no attributes; no `registerModel`, no `tableName`, no key options. Check the sibling callback tests in the same file for the same bespoke-owner shape and converge them together.

## Acceptance criteria

- [ ] The test's owner is an anonymous subclass of canonical `Project` named `Project`, with the option list Rails passes.
- [ ] No `registerModel` call and no bespoke table/key options remain in that test.
- [ ] Test name unchanged; `pnpm parity:test` delta non-negative.
