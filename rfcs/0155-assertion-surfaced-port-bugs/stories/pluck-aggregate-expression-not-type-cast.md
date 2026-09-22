---
title: "pluck-aggregate-expression-not-type-cast"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced converging `calculations_test.rb` assertions for
`assertions-tail-root-7`.

`Relation#pluck` of an aggregate SQL expression returns the raw driver value
instead of the attribute-type-cast one.

Rails (`vendor/rails/activerecord/test/cases/calculations_test.rb:903-913`):

```ruby
def test_pluck_type_cast
  topic = topics(:first)
  relation = Topic.where(id: topic.id)
  assert_equal [ topic.approved ], relation.pluck(:approved)
  assert_equal [ topic.last_read ], relation.pluck(:last_read)
  assert_equal [ topic.written_on ], relation.pluck(:written_on)
  assert_equal(
    [[topic.written_on, topic.replies_count]],
    relation.pluck("min(written_on)", "min(replies_count)")
  )
end
```

The first three assertions pass in trails. The fourth does not: trails returns
`[["2003-07-16 14:28:11.223300", 1]]` where Rails returns
`[[Time, 1]]` — the `min(written_on)` column is handed back as the raw string,
not run through the column's type. Rails does the cast in
`Calculations#type_cast_pluck_values`, which looks the type up through
`@klass.attribute_types` keyed by the column's result name.

Parked in `packages/activerecord/src/calculations.test.ts` with a converged
body and a `BLOCKED:` line: `pluck type cast`.

Rails source: `activerecord/lib/active_record/relation/calculations.rb`
(`pluck`, `type_cast_pluck_values`).

## Acceptance criteria

- [ ] `Topic.where({ id }).pluck("min(written_on)", "min(replies_count)")`
      returns the type-cast `written_on` value, matching `topic.written_on`.
- [ ] The parked test in `calculations.test.ts` is un-skipped and passes with
      its converged body unchanged.
