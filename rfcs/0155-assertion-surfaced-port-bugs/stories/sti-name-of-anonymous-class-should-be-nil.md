---
title: "sti-name-of-anonymous-class-should-be-nil"
status: ready
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sanitize_test.rb`'s `test_sanitize_sql_like_example_use_case` is parked
`it.skip` in `packages/activerecord/src/sanitize.test.ts`. It passes on SQLite
and MySQL and fails on PostgreSQL, which is what surfaced the bug.

Rails builds its subject with an **anonymous** class
(`sanitize_test.rb:82`): `searchable_post = Class.new(Post) do … end`.

`Inheritance::ClassMethods#sti_name`
(`activerecord/lib/active_record/inheritance.rb:187-189`) is

```ruby
def sti_name
  store_full_sti_class && store_full_class_name ? name : name.demodulize
end
```

Both flags default to true, so an anonymous class takes the first arm and
`sti_name` is **`nil`** (`Module#name` is nil for an anonymous class; the
`.demodulize` arm, which would raise, is not reached). `type_condition`
(`inheritance.rb:322-327`) then calls
`predicate_builder.build(sti_column, [nil])`, which is `"posts"."type" IS NULL`
— **no bind parameter**. That is precisely why the Rails test can expect
`/title LIKE \$1/` on PostgreSQL: the LIKE term is the _first_ bind.

trails' `stiName` (`packages/activerecord/src/inheritance.ts:171-178`) returns
a `string`, never null, so an anonymous class yields `""`:

```text
NAMED   : … WHERE "posts"."type" = 'NamedPost' AND (title LIKE 'x')
ANON    : … WHERE "posts"."type" = 'anon'      AND (title LIKE 'x')   (JS infers a name)
ANON2   : … WHERE "posts"."type" = ''          AND (title LIKE 'x')   (truly anonymous)
PLAINPST: … WHERE (title LIKE 'x')
```

`type = ''` **is** a bind, so on PostgreSQL the LIKE placeholder shifts to `$2`
and the observed CI failure is:

```text
1 or more queries expected, but none were executed.
Queries:
SELECT "posts".* FROM "posts" WHERE "posts"."type" = $1 AND (title LIKE $2)
```

Note the second-order effect: JS _infers_ a name for `const x = class extends
Post {}` (it becomes `"x"`), so only `(0, class extends Post {})` is genuinely
anonymous — and even that gives `""`, not null.

## Acceptance criteria

- `stiName` answers the trails equivalent of Ruby's nil for an anonymous class,
  and `typeCondition` builds `IS NULL` rather than an equality bind for it,
  mirroring `inheritance.rb:187-189,322-327`.
- Every `stiName` caller is audited for the nullable return —
  `inheritance.ts:431` (`_writeAttribute` of the inheritance column),
  `inheritance.ts:481-485` (`typeCondition`) and `inheritance.ts:534`
  (`stiClassFor`'s comparison) at minimum.
- The parked `sanitize sql like example use case` in
  `packages/activerecord/src/sanitize.test.ts` is un-skipped, its `BLOCKED:`
  line removed, and it is green on PostgreSQL as well as SQLite and MySQL.
