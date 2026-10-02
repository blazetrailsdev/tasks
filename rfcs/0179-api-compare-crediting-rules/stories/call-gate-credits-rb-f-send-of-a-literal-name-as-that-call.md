---
title: 'parity: rbFSend(recv, "name", …) with a literal name is a call to name'
status: draft
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: call-set
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`DisableJoinsAssociationRelation#first` (`vendor/rails/v8.0.2/activerecord/lib/active_record/disable_joins_association_relation.rb:17-23`) calls
`limit` on the loaded records:

```ruby
def first(limit = nil)
  if limit
    records.limit(limit).first
  else
    records.first
  end
end
```

`records` is an Array, which has no `limit`, so the `limit` arm raises `NoMethodError` in Rails.
`packages/activerecord/src/disable-joins-association-relation.ts` ports that arm as
`rbFSend(records, "limit", limit)` (`rb_f_send`, `vendor/ruby/v3.3.11/vm_eval.c:1330`), which
raises the same `NoMethodError` where a plain `records.limit(limit)` would be a `TypeError` and a
type error at compile time.

The call-set gate reads the callee `rbFSend` and not the method it names, so the body is charged
with an omitted `limit` and carries `@missingRailsCall limit`.

## Acceptance criteria

- [ ] `extract-ts-api.ts` records `rbFSend(x, "name", …)` / `rbFPublicSend(x, "name", …)` with a string-literal second argument as a call to `name` (camelCase, so it meets the Ruby name through `rubyMethodToTs`), with an extractor unit test covering the literal case and a non-literal name staying uncredited.
- [ ] `disable-joins-association-relation.ts`'s `@missingRailsCall limit` is deleted (the gate reds a receipt that suppresses nothing).
- [ ] Any other receipt or baseline row the rule clears is deleted in the same PR; no new row appears.
