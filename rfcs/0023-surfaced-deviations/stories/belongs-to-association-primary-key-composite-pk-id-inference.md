---
title: "belongs_to associationPrimaryKeys: infer id from [tenant,id] composite PK target (reflection.rb:935-938)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3625
claim: "2026-06-19T03:00:26Z"
assignee: "belongs-to-association-primary-key-composite-pk-id-inference"
blocked-by: null
---

## Context

Surfaced during RFC 0019 wave 6 (PR #3572) while aligning
`BelongsToAssociation#associationPrimaryKeys`
(`packages/activerecord/src/associations/belongs-to-association.ts`) with Rails
`BelongsToReflection#association_primary_key` (reflection.rb:926-938).

The query-constraints branch (reflection.rb:933-934) was ported, but the
following `composite_primary_key?` branch is still absent in trails:

```ruby
elsif (klass || self.klass).composite_primary_key?
  # If klass has composite primary key of shape [:<tenant_key>, :id], infer primary_key as :id
  primary_key = (klass || self.klass).primary_key
  primary_key.include?("id") ? "id" : primary_key
```

trails' `associationPrimaryKeys` instead falls through to returning the target's
full composite primary key array. For a belongs_to to a target whose PK is the
`[<tenant_key>, :id]` shape (and which does NOT use query_constraints), Rails
infers the single `"id"` as the association primary key, whereas trails returns
the 2-column array — a latent divergence in the composite-FK zip.

This gap predates PR #3572 and was not introduced or worsened by it (confirmed
in review). No current model exercises this exact shape, so it is latent.

## Acceptance criteria

- [x] `associationPrimaryKeys` mirrors reflection.rb:935-938: when the target
      has a composite primary key (and no query_constraints / explicit
      primaryKey), infer `"id"` when the composite PK includes `"id"`, else
      return the composite PK array.
- [x] Add a focused test exercising a belongs_to to a `[tenant_key, :id]`-PK
      target without query_constraints; assert the derived association primary
      key / FK columns match Rails.
- [x] No regression in existing composite-key / belongs_to suites.

- trails: `packages/activerecord/src/associations/belongs-to-association.ts`
  (`associationPrimaryKeys`)
- Rails: `vendor/rails/activerecord/lib/active_record/reflection.rb:926-938`
