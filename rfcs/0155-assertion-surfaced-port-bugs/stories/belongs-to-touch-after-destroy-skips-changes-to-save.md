---
title: "belongs_to touch after_destroy passes an empty Hash behind an invented guard instead of changes_to_save"
status: draft
updated: 2026-09-25
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

Rails registers the belongs_to touch callback for destroy with
`changes_to_save`:
`model.after_destroy callback.(:changes_to_save)`
(`vendor/rails/activerecord/lib/active_record/associations/builder/belongs_to.rb:97`),
where `callback` is `BelongsTo.touch_record(record, record.send(changes_method), foreign_key, name, touch)` (`:84-86`).

trails' `BelongsTo.addTouchCallbacks`
(`packages/activerecord/src/associations/builder/belongs-to.ts`, the
`model.afterDestroy(...)` arm) instead:

- guards on `!record.isNewRecord()`, a guard Rails does not have;

- passes a fresh empty `new Hash()` rather than `record.changesToSave`.

So a record that is destroyed with an unsaved foreign-key change does not
touch its old parent, which Rails' `touch_record` does through
`changes[foreign_key].first` (`:45`). Also, `makeCallback`'s
`?? new Hash()` fallback exists only to serve the invented arm. It came over
from a pre-trails#8070 `?? {}`.

## Converged shape

`model.afterDestroy(makeCallback("changesToSave"))`, with no extra guard and no
fallback, the same shape as the create/update/touch arms.

## Acceptance criteria

- The destroy arm reads `changes_to_save` like `belongs_to.rb:97`, and the

  invented `isNewRecord` guard and empty-Hash argument are gone.

- A test destroys a record whose foreign key changed but was not saved, and

  asserts the old parent is touched, as Rails does.
