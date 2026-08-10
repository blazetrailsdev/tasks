---
title: "Polymorphic t.references emits x_type before x_id; both canonical sources reverse it"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6198
claim: "2026-08-07T20:08:49Z"
assignee: "polymorphic-reference-type-column-comes-first"
blocked-by: null
closed-reason: null
---

## Context

`ReferenceDefinition#columns` puts the polymorphic `_type` column **first**:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:280-286
def columns
  result = [[column_name, type, options]]
  if polymorphic
    result.unshift(["#{name}_type", :string, polymorphic_options])
  end
  result
end
```

`add_to` then walks that array in order (`:233-236`), so `t.references :record,
polymorphic: true` emits `record_type` and _then_ `record_id`. Both canonical
sources declare the pair the other way round — `record_id` first — for every
polymorphic reference:

```ts
// packages/activerecord/src/support/canonical-schema.ts, attachments
t.bigInteger("record_id", { null: false });
t.string("record_type", { null: false });
t.index(["record_type", "record_id"], { name: "index_attachments_on_record" });
```

Found while sweeping `t.references` widths and indexes in PR #6191; column
order was out of that PR's scope (reordering is invisible to
`parity:schema`, which compares columns as a map, but it _is_ visible in a
`schema_dumper` round-trip and in `SELECT *` ordinal positions).

Every polymorphic `t.references` in `schema.rb` is affected — `attachments`
(:80), `sharded_blog_posts` (:340), `comments` (:387),
`comment_overlapping_counter_caches` (:404), `members` (:769), `treasures`
(:910), `sponsors` (:1158-1159), `faces` (:1290), `wheels` (:1311).

Note the same `columns` array carries `polymorphic_options` (`:258-260`) —
`as_options(polymorphic).merge(conditional_options).merge(options.slice(:null,
:first, :after))` — so a `null: false` on the reference applies to the `_type`
column too, which both sources already get right.

## Converged shape

Every polymorphic reference declares `x_type` immediately before `x_id` in both
`canonical-schema.ts` and `test-helpers/test-schema.ts`, matching Rails'
emission order.

## Acceptance criteria

- [ ] `x_type` precedes `x_id` for every polymorphic `t.references` in both
      canonical sources.
- [ ] `pnpm parity:schema` clean; the schema-dumper suite green on all three
      lanes.
