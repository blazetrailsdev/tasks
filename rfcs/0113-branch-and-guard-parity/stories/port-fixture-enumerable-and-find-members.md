---
title: "port-fixture-enumerable-and-find-members"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 68
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Fixture` (`vendor/rails/activerecord/lib/active_record/fixtures.rb:806-846`)
carries five members the trails port does not:

```ruby
class Fixture # :nodoc:
  include Enumerable

  class FixtureError < StandardError; end
  class FormatError < FixtureError; end

  def each(&block)   = fixture.each(&block)
  def [](key)        = fixture[key]
  alias :to_hash :fixture

  def find
    raise FixtureClassNotFound, "No class attached to find." unless model_class
    object = model_class.unscoped do
      pk_clauses = fixture.slice(*Array(model_class.primary_key))
      model_class.find_by!(pk_clauses)
    end
    object.instance_variable_set(:@strict_loading, false)
    object
  end
end
```

`packages/activerecord/src/fixtures.ts` ports `initialize`, the
`model_class` / `fixture` readers and `class_name` only — the class was
introduced by `port-active-record-fixture-class-and-encrypted-fixtures-module`
so `EncryptedFixtures` had something to prepend onto, and nothing in trails
calls the rest yet. `FixtureError` lives at file scope there rather than nested
in `Fixture`, and `FormatError` has no port at all.

`find` is the one member that is not mechanical: `model_class.find_by!` is
async in trails, so the port returns a promise where Rails returns the record,
and `unscoped`'s block form and the `@strict_loading` write both need their
trails spellings checked first.

## Acceptance criteria

- [ ] `each`, `[]` (named per `OPERATOR_SPELLING_BY_FQN`) and `to_hash` are
      ported at `fixtures.rb:826-834`.
- [ ] `find` is ported at `fixtures.rb:836-845`, including the
      `FixtureClassNotFound` raise, the `unscoped` block, the primary-key slice
      and the `@strict_loading` reset.
- [ ] `FormatError` is ported, and `FixtureError` is nested inside `Fixture` as
      Rails nests it (`fixtures.rb:809-813`) if the `fixture-error-slot.ts`
      reader admits it.
