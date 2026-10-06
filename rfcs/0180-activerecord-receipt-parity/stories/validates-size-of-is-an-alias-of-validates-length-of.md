---
title: "activerecord: validates_size_of is an alias of validates_length_of, not a second body"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit (trails#8395), which moved
`validatesLengthOf` and `validatesSizeOf` from `validations.ts` into
`packages/activerecord/src/validations/length.ts`, where Rails declares them.

Rails declares one method and an alias
(`vendor/rails/v8.0.2/activerecord/lib/active_record/validations/length.rb:19-23`):

```ruby
def validates_length_of(*attr_names)
  validates_with LengthValidator, _merge_attributes(attr_names)
end

alias_method :validates_size_of, :validates_length_of
```

trails declares two functions with identical bodies. The audit moved them verbatim, because how the
extractor credits an aliased member of an object-literal `ClassMethods` was not checked.

## Acceptance criteria

- [ ] `validatesSizeOf` is an alias of `validatesLengthOf` (one body), in the spelling the extractor credits to `validates_size_of`.
- [ ] `validations/length.rb -> validations/length.ts` stays fully matched; `pnpm parity:api:calls` and `:extra:gate` green; `packages/activerecord/src/validations/length-validation.test.ts` stays green.
