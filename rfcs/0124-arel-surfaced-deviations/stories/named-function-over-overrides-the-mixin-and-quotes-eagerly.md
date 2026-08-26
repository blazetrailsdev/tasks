---
title: "NamedFunction#over overrides a mixin Rails doesn't override and quotes the window name eagerly"
status: draft
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7102 (RFC 0124) while converting `NamedFunction#over` from a
bound instance property to a prototype method so a generic clone could not
carry it still closed over the original. The conversion was mechanical; the
method it converted is the deviation.

Rails has **no** `NamedFunction#over` at all. `named_function.rb` defines only
`initialize`, `hash` and `eql?`. `#over` comes from the mixin, and it is one
line:

```ruby
# vendor/rails/activerecord/lib/arel/window_predications.rb:5-7
def over(expr = nil)
  Nodes::Over.new(self, expr)
end
```

The operand is stored **raw**; every coercion happens later, in the visitor:

```ruby
# vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:300-311
def visit_Arel_Nodes_Over(o, collector)
  case o.right
  when nil
    visit(o.left, collector) << " OVER ()"
  when Arel::Nodes::SqlLiteral
    infix_value o, collector, " OVER "
  when String, Symbol
    visit(o.left, collector) << " OVER #{quote_column_name o.right.to_s}"
  else
    infix_value o, collector, " OVER "
  end
end
```

`packages/arel/src/nodes/named-function.ts:29-37` overrides the mixin and does
the coercion eagerly at build time instead. Two divergences follow:

1. **The override should not exist.** Rails resolves every one of these arms in
   `visit_Arel_Nodes_Over`, which trails already has, so the override is doing a
   second time what the visitor is there to do.
2. **A String operand renders differently.** trails wraps it in
   `new SqlLiteral(window)`, so it reaches the visitor's SqlLiteral arm and
   emits `OVER <raw sql>`. Rails' String arm emits
   `OVER #{quote_column_name(...)}`. The `NamedWindow` arm hand-rolls that
   quoting with a literal `"` and a `replace(/"/g, '""')` doubling, which
   bypasses the adapter's `quoteColumnName` — so it is wrong on MySQL, where
   the identifier quote is a backtick, not a double quote.

## Converged shape

Delete `NamedFunction#over` and let `WindowPredications.over` (which trails
already mixes into `Function`) answer, storing the operand raw. Move whatever
arms are genuinely needed into `visitArelNodesOver` so it branches exactly as
to_sql.rb:300-311 does, with the String/Symbol arm going through
`quoteColumnName` rather than a hand-rolled double-quote.

Check `NamedFunction`'s constructor while in there: Rails is
`initialize(name, expr, aliaz = nil)` (named_function.rb:8-11), three
parameters; trails takes a fourth, `distinct = false`, which Rails' ctor does
not have (`Function#initialize` sets `@distinct = false` unconditionally,
function.rb).

## Acceptance criteria

- [ ] `NamedFunction` defines no `over`; `WindowPredications.over`
      (window_predications.rb:5-7) is the only one, and stores the operand raw.
- [ ] `visitArelNodesOver` branches nil / SqlLiteral / String|Symbol / else
      exactly as to_sql.rb:300-311, the String arm through `quoteColumnName`.
- [ ] A test pins that a String window name is quoted by the ADAPTER — so it is
      backticked on MySQL — rather than emitted as raw SQL.
- [ ] `nodes/over_test.rb` and `named_function_test.rb` stay green and mirrored;
      `parity:api:extra:gate` does not rise.
