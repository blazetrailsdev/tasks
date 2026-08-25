---
title: "Config#add_previous_scheme pushes a Scheme, not the raw options bag"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6102
claim: "2026-08-04T21:23:01Z"
assignee: "i18n-date-parse-extract-valid-date-frags-p"
blocked-by: null
closed-reason: null
---

## Context

`Config#add_previous_scheme`
(activerecord/lib/active_record/encryption/config.rb:66-68) pushes a
constructed `Scheme`:

```ruby
def add_previous_scheme(**properties)
  previous_schemes << ActiveRecord::Encryption::Scheme.new(**properties)
end
```

`packages/activerecord/src/encryption/config.ts:148-150` pushes the raw options
bag instead, and `previousSchemes` is typed `SchemeOptions[]` (config.ts:52)
rather than `Scheme[]`. So every consumer of `config.previousSchemes` sees a
plain object where Rails sees a `Scheme`, and `Scheme`'s own validation
(scheme.rb:86-87 — `compressor:` can't be used with `compress: false`, or with
an explicit `encryptor:`) never runs at configure time the way it does in
Rails.

## Converged shape

- `previousSchemes: Scheme[]`, and `addPreviousScheme` constructs
  `new Scheme(properties)` as config.rb:67 does.
- Trace the readers of `previousSchemes` (`configurable.ts:57`, the scheme
  resolution path) and drop whatever re-wraps the options bag on their side.

## Acceptance criteria

- [ ] `addPreviousScheme` pushes a `Scheme`, matching config.rb:66-68.
- [ ] Declaring a previous scheme with an invalid combination raises at
      configure time, as `Scheme#validate_config!` (scheme.rb:86-87) does.
- [ ] Encryption suites green on all three lanes.
