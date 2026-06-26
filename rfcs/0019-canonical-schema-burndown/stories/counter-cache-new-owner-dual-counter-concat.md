---
title: "counter-cache-new-owner-dual-counter-concat"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`counter-cache.test.ts`'s port of Rails' `counter_cache_test.rb` "active counter
cache" (vendor/rails/activerecord/test/cases/counter_cache_test.rb:464-482) had
to deviate from the Rails new-owner shape:

```ruby
car = Car.new
car.tyres = [Tyre.new, Tyre.new]
car.save!
assert_equal 2, car.custom_tyres_count
```

Rails defers the tyre inserts until owner save — `concat_records` skips
insertion while `owner.new_record?`
(activerecord/lib/active_record/associations/collection_association.rb:441-448),
then autosave persists them on `car.save!`, so the belongs_to counter_cache
increments exactly twice → `custom_tyres_count == 2` with 2 rows.

In trails the literal shape is broken for an association declaring
`counter_cache` on BOTH sides — Tyre `belongs_to :car, counter_cache:
{active: true, column: :custom_tyres_count}` AND Car `has_many :tyres,
counter_cache: :custom_tyres_count` (test-helpers/models/tyre.ts,
test-helpers/models/car.ts:17). Both `(car as any).tyres = [...]` and
`association(car, "tyres").replace([...])` on an unsaved Car, followed by
`car.save()`, persist THREE tyre rows and leave `custom_tyres_count` at 4
in memory / 3 after reload. A single-counter association (Car `has_many
:engines`, Engine `belongs_to :my_car, counter_cache: :engines_count`) behaves
correctly under the same new+assign+save shape (2 rows, counter 2), so the bug
is specific to the dual (belongs_to + has_many) counter_cache declaration
interacting with new-record collection autosave.

As a stopgap, the test saves the owner first (`Car.create()` then
`association(car, "tyres").replace([...])`), which yields the correct 2 rows /
counter 2 and exercises the test's real subject (the queryless active-cache
`size`/`empty?`/`any?`/`none?` reads). The counter-cache-on-create behavior is
still covered faithfully by the sibling "counters are updated both in memory
and in the database on create" test (engines), which uses the exact
new+assign+save shape.

## Acceptance criteria

- [ ] `new Car()` + `car.tyres = [new Tyre(), new Tyre()]` + `car.save()`
      persists exactly 2 tyre rows and sets `custom_tyres_count` to 2 (in memory
      and after reload), matching Rails.
- [ ] Root-cause the extra insert + extra increment in the new-record
      collection autosave path when an association declares counter_cache on
      both the belongs_to and the has_many side; fix without regressing the
      single-counter case (engines).
- [ ] Restore the Rails new-owner shape in counter-cache.test.ts's "active
      counter cache" test and drop the stopgap `Car.create()` workaround +
      its explanatory comment.
