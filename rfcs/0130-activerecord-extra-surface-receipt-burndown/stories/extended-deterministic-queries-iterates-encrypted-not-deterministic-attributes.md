---
title: "extended-deterministic-queries-iterates-encrypted-not-deterministic-attributes"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`EncryptedQuery.process_arguments`
(`vendor/rails/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:43-67`)
drives off `deterministic_encrypted_attributes`, not `encrypted_attributes`:

```ruby
return args if owner.deterministic_encrypted_attributes&.empty?
...
options = options.transform_keys { |key| key.is_a?(Array) ? key.map(&:to_s) : key.to_s }
args[0] = options
owner.deterministic_encrypted_attributes&.each do |attribute_name|
  attribute_name = attribute_name.to_s
  type = owner.type_for_attribute(attribute_name)
  if !type.previous_types.empty? && value = options[attribute_name]
```

`scope_for_create` does the same (`:104-105`: `return super unless model.deterministic_encrypted_attributes&.any?`).

trails (`packages/activerecord/src/encryption/extended-deterministic-queries.ts`) iterates
`model.encryptedAttributes` at both sites and re-tests `type.deterministic` per attribute, so
`deterministicEncryptedAttributes` — the memoized set Rails narrows with, and the only reader of
`_deterministicEncryptedAttributes` — is bypassed on the query path. Three consequences:

- The early return is missing: Rails leaves `args` untouched when the set is empty; trails walks
  every encrypted attribute first.
- `transform_keys` (`:49-56`) has no port, so an Array key or a Symbol key is not stringified.
- `encryptAttribute` (`packages/activerecord/src/encryption/encryptable-record.ts`) keeps a
  `delete modelClass._deterministicEncryptedAttributes` memo-invalidation that Rails has no
  counterpart for — Rails' `@deterministic_encrypted_attributes ||=`
  (`encryption/encryptable_record.rb:58-62`) is never invalidated, because nothing reads it before
  declarations finish.

Surfaced while converging `encrypts` onto `decorate_attributes` in trails#7728, which read these
call sites to delete `encryptedTypeOf` but left the iteration source alone as out of scope.
Distinct from `extended-deterministic-queries-receiver-as-parameter`, which is about `self` being
passed as an ordinary parameter.

## Acceptance criteria

- `processArguments` and `scopeForCreate` iterate `deterministicEncryptedAttributes` and carry
  Rails' early returns (`:46`, `:104-105`).
- `transform_keys` (`:49-56`) is ported, Array-key arm included.
- `delete modelClass._deterministicEncryptedAttributes` is removed once nothing needs it, matching
  Rails' uninvalidated memo.
