---
title: "arel-build-quoted-passes-model-attribute-unwrapped"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced by review of PR #4876 (arel-unboundable-sign-duck-types-like-rails),
raised twice; recording it so it stops being re-derived.

Rails' `Nodes.build_quoted` passes an `ActiveModel::Attribute` through
**unwrapped** (`vendor/rails/activerecord/lib/arel/nodes/casted.rb:48-60`):

```ruby
def self.build_quoted(other, attribute = nil)
  case other
  when Arel::Nodes::Node, Arel::Attributes::Attribute, Arel::Table,
       Arel::SelectManager, Arel::Nodes::SqlLiteral, ActiveModel::Attribute
    other
  else
    ...
```

The visitor then handles it directly via `visit_ActiveModel_Attribute`
(`arel/visitors/to_sql.rb:756-758`).

Trails instead wraps it in a `BindParam`
(`packages/arel/src/nodes/casted.ts:26-45`), and `Attribute#quotedNode` does the
same for a `ModelAttribute` (`packages/arel/src/attributes/attribute.ts:148-158`).

**This is behaviorally equivalent, not merely close** — do not "fix" it as a
bug. Rails:

```ruby
def visit_ActiveModel_Attribute(o, collector)
  collector.add_bind(o, &bind_block)          # to_sql.rb:756-758
end

def visit_Arel_Nodes_BindParam(o, collector)
  collector.add_bind(o.value, &bind_block)    # to_sql.rb:760-762
end
```

So Rails' bare `attr` and trails' `BindParam(attr)` both `add_bind(attr)` —
identical payload. The `unboundable?` / `nil?` delegations survive the wrap
too (`bind-param.ts:50-52`, `:39-43`), which is what #4876's visitor tests rely
on.

What is genuinely missing is the **surface**: trails' `ToSql` has no
`visitActiveModelAttribute` (only `visitors/dot.ts:384` has one), so an
`ActiveModel::Attribute` reaching `ToSql.visit` unwrapped — i.e. from anywhere
that bypasses `buildQuoted` / `quotedNode` — has no dispatch target. Today
nothing does that, because both wrap-sites are the only entry points.

This is an api:compare surface + shape-fidelity question, not a behavior bug.

## Acceptance criteria

- [ ] Decide and record ONE of:
      (a) port `visit_ActiveModel_Attribute` (`to_sql.rb:756-758`) onto `ToSql`
      and stop wrapping in `buildQuoted` / `quotedNode`, matching
      `casted.rb:48-60` exactly; or
      (b) keep the `BindParam` wrap and document it at `casted.ts` with the
      `add_bind(o)` vs `add_bind(o.value)` equivalence proof above, so the next
      reviewer does not re-derive it.
- [ ] If (a): `Attribute#quotedNode`'s `ModelAttribute` arm
      (`attribute.ts:154-156`) goes too — both wrap-sites move together, or the
      AST shape diverges by call path.
- [ ] Bind extraction is unchanged for QueryAttribute binds: `type_casted_binds`
      / prepared-statement paths still see `value_for_database`. See
      `project_type_casted_binds_17_producers_diverge` — 16 producers, do not
      converge one in isolation.
- [ ] `unboundable?` / `nil?` delegation behavior preserved either way —
      #4876's `to-sql.test.ts` unboundable tests must stay green.
- [ ] api:compare / test:compare delta non-negative.
