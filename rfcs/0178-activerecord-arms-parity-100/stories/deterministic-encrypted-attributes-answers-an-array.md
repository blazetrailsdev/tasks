---
title: "activerecord: deterministic_encrypted_attributes answers an Array, not a Set"
status: done
updated: 2026-10-08
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8682
claim: "2026-10-08T15:05:12Z"
assignee: "migration-compatibility-find-stringifies-the-version-in-one-call"
blocked-by: null
closed-reason: null
---

## Context

Rails memoizes an Array on the class
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb:22-26`):

```ruby
def deterministic_encrypted_attributes
  @deterministic_encrypted_attributes ||= encrypted_attributes&.find_all do |attribute_name|
    type_for_attribute(attribute_name).deterministic?
  end
end
```

`deterministicEncryptedAttributes`
(`packages/activerecord/src/encryption/encryptable-record.ts`) keeps the `&.`
arm and the own-class memo since trails#8492, but wraps the `find_all` answer in
a `Set`, because its callers read it as one:

- `encryption/extended-deterministic-queries.ts`: `?.size === 0`, and two
  `for … of` loops.
- `encryption/extended-deterministic-uniqueness-validator.ts`: `?.has(attribute)`.
- `base.ts` declares it `() => Set<string> | undefined`.

Rails' callers use `empty?`, `each` and `include?`
(`extended_deterministic_queries.rb`, `extended_deterministic_uniqueness_validator.rb`).

## Acceptance criteria

- [ ] `deterministicEncryptedAttributes` answers the Array `find_all` answers,
      with no `Set` wrapper, and `base.ts` declares it so.
- [ ] Each caller reads it the way its Rails body does (`isEmpty` / iteration /
      `includes`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
