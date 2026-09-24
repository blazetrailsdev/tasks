---
title: "A model cannot override timestamp_attributes_for_update: timestamp.ts calls the module function, not the class"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8028
claim: "2026-09-24T13:29:52Z"
assignee: "model-cannot-override-timestamp-attributes-for-update"
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. Filed under this RFC by the user's
direction: there is no activerecord surfaced-deviations bucket.

Rails lets a model narrow which columns the timestamp touch writes by
overriding a private class method.
`ActiveRecord::Timestamp::ClassMethods#timestamp_attributes_for_create_in_model`
and `#timestamp_attributes_for_update_in_model`
(`activerecord/lib/active_record/timestamp.rb:64-72`) call
`timestamp_attributes_for_create` / `timestamp_attributes_for_update`
(`:92-99`) through `self`, so a model's override wins:

```ruby
class Story < ApplicationRecord
  class << self
    private def timestamp_attributes_for_update = ["updated_at"]
  end
end
```

trails calls the module functions directly, not through the class:

```ts
// packages/activerecord/src/timestamp.ts:62-82
this._timestampAttributesForCreateInModel = timestampAttributesForCreate
  .call(this)
  .filter((a) => cols.has(a));
...
this._timestampAttributesForUpdateInModel = timestampAttributesForUpdate
  .call(this)
  .filter((a) => cols.has(a));
```

A `static timestampAttributesForUpdate()` on a model is never consulted.

trailmap needs exactly this override. `updated_on` there is a date-only
markdown field, and Rails' default update columns include it
(`["updated_at", "updated_on"]`, `timestamp.rb:97`), so a save stamped a full
instant into it and took down every read verb. With no override available,
trailmap monkey-patches the private memo caches
(`app/models/timestamps.ts:22-40`, `pinTimestampColumns`). It uses
`Object.defineProperty` accessors on `_timestampAttributesForCreateInModel`,
`_timestampAttributesForUpdateInModel` and `_allTimestampAttributesInModel`,
with inert setters so `reloadSchemaFromCache` (`timestamp.ts:98-104`) can't
reset them. Its comment records a first attempt that assigned the caches
directly: it passed tests and corrupted two production rows 26 minutes later.

## Acceptance criteria

- `timestampAttributesForCreateInModel` / `timestampAttributesForUpdateInModel`
  dispatch `timestampAttributesForCreate` / `timestampAttributesForUpdate`
  through the receiver class, as `timestamp.rb:64-72` does. A model that
  defines `static timestampAttributesForUpdate()` changes which columns `touch`
  and `save` stamp.
- The memo reset in `reloadSchemaFromCache` stays as it is: a recomputation
  re-consults the override.
- A regression test that fails on the current baseline defines a model with an
  `updated_on` column, overrides `timestampAttributesForUpdate` to
  `["updated_at"]`, saves a change, and asserts `updated_on` is untouched,
  including after `resetColumnInformation`.
- trailmap's `pinTimestampColumns` is then deleted on re-vendor. That removal is
  tracked by trailmap's model-conventions story.
