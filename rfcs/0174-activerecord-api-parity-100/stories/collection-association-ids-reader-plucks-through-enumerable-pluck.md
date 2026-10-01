---
title: "activerecord: ids_reader is three Enumerable#pluck arms, and pluck sends [] to a record"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/associations/collection-association.ts` `idsReader` carries
`@missingRailsCall empty?`. Rails' body is three `pluck` arms
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:51-59`):

```ruby
def ids_reader
  if loaded?
    target.pluck(*reflection.association_primary_key)
  elsif !target.empty?
    load_target.pluck(*reflection.association_primary_key)
  else
    @association_ids ||= scope.pluck(*reflection.association_primary_key)
  end
end
```

The port maps the target through a hand-written `readKey` closure instead of `Enumerable#pluck`,
so writing `isEmpty(this.target)` alone turns the suppressed row into an ORDER row
(`order:isEmpty,pluck`): Rails plucks before it asks `empty?`.

The blocker is `Enumerable#pluck` itself. Rails' is `map { |element| element[key] }`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:145-152`), and on a record
`[]` is `read_attribute` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:415-417`,
`attribute_methods/read.rb:29-34`). trails' `pluck` (`packages/activesupport/src/enumerable-utils.ts:197`)
reads a JS property, and on a composite-primary-key model the `id` PROPERTY answers the whole key where
`record[:id]` answers the `id` column. Porting the three arms onto today's `pluck` reds
`ids reader on preloaded association with composite primary key`
(`packages/activerecord/src/associations/has-many-associations.test.ts`), which is what this audit measured.

## Acceptance criteria

- [ ] activesupport's `pluck` sends Ruby's `element[key]`: a record answers through `readAttribute`, a hash through its key.
- [ ] `idsReader` is the three Rails arms, each a `pluck(..., ...reflection.associationPrimaryKey)`; the `readKey` closure and the `associationPrimaryKey()` fallback ladder it reads are gone.
- [ ] The `@missingRailsCall empty?` receipt is deleted and `pnpm parity:api:calls` is green with no new baseline row.
- [ ] `ids reader on preloaded association with composite primary key` and the other `ids reader` cases pass.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts -t "ids reader"
```
