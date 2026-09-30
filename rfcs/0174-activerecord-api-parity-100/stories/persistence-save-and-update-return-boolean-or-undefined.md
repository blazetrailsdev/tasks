---
title: "persistence-save-and-update-return-boolean-or-undefined"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`save` and `update` on a record are typed `Promise<boolean | undefined>`
(`packages/activerecord/src/persistence.ts:375,546`, `base.ts:2401`). Rails always
returns a boolean
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:390-394`,
`create_or_update` at `:891-896`):

```ruby
def save(**options, &block)
  create_or_update(**options, &block)
rescue ActiveRecord::RecordInvalid
  false
end

def create_or_update(**, &block)
  ...
  result = new_record? ? _create_record(&block) : _update_record(&block)
  result != false
end
```

`update(attributes)` (`:563`) returns `save`'s result. The `undefined` arm has no
Rails counterpart. Either a body path returns `undefined` (a fidelity bug), or the
signature is looser than the body.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Acceptance criteria

- [ ] `save` / `update` resolve to `boolean` on every path, and the declared types are `Promise<boolean>`.
- [ ] If any path returned `undefined`, it's converged onto `result != false` and covered by a test.
