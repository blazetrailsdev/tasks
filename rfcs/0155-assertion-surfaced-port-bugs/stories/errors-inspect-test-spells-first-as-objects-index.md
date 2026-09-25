---
title: "errors_test inspect builds its expected string from objects[0], not Errors#first"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#8065
claim: "2026-09-24T23:24:18Z"
assignee: "hwia-test-enumerator-and-yaml-remainder"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `errors_test.rb` in trails#7900, and declared in that PR's
body rather than left silent.

Rails builds the expected string for `test "inspect"` from `Errors#first`:

```ruby
# vendor/rails/activemodel/test/cases/errors_test.rb:705-710
test "inspect" do
  errors = ActiveModel::Errors.new(Person.new)
  errors.add(:base)

  assert_equal(%(#<ActiveModel::Errors [#{errors.first.inspect}]>), errors.inspect)
end
```

`packages/activemodel/src/errors.test.ts` spells that `errors.objects[0].inspect()`,
because `Errors#first` does not exist in trails — `Errors` is
`include Enumerable` at `activemodel/lib/active_model/errors.rb:41` and the port
defines only `each`.

The test is NOT parked: its subject is `Errors#inspect`, which it does
exercise, and it passes. Only the expected-string construction reaches for a
different accessor, so nothing is masked and no assertion row is affected. It
is a spelling deviation, tracked so it is not rediscovered.

Every other `person.errors.objects[0]` in that file sits at a line where Rails
itself writes `person.errors.objects.first`
(`errors_test.rb:174,181,198,218,235,246`); this is the single exception.

## Converged shape

```ts
expect(errors.inspect()).toBe(`#<ActiveModel::Errors [${errors.first.inspect()}]>`);
```

Depends on `activemodel-errors-does-not-include-enumerable`, which adds
`Errors#first`; that story's acceptance criteria name only the three tests it
parks, so this line would otherwise be missed when it lands.

## Acceptance criteria

- [ ] `test "inspect"` in `packages/activemodel/src/errors.test.ts` builds its
      expected string from `errors.first.inspect()`, matching
      `errors_test.rb:709`.
- [ ] No remaining `errors.objects[...]` in that file at a line where Rails
      does not itself write `objects`.
