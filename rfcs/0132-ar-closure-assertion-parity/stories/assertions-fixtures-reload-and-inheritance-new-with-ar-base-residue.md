---
title: "Converge fixtures reload-accessor and inheritance new-with-ar-base assertion residue"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
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

After trails#7971, `pnpm parity:test -- --package activerecord --assertions --missing` still lists two
activerecord rows outside `has_many_associations_test.rb` that no story owns (the third,
`encryptable_record_test.rb` forced encoding, is `assertions-uniqueness-singleton-and-forced-encoding-residue`):

- `fixtures_test.rb` › `reloading fixtures through accessor methods` — kind: equal rails 2 vs trails 3,
  Rails uses `assert_called` (`vendor/rails/activerecord/test/cases/fixtures_test.rb`, grep
  `test_reloading_fixtures_through_accessor_methods`). Converge the trails body to Rails' shape.
- `inheritance_test.rb` › `new with ar base` — value: Rails expects
  `"ActiveRecord::Base is an abstract class and cannot be instantiated."`, trails asserts
  `"Base is an abstract class …"`. Rails raises from `Inheritance::ClassMethods#new`
  (`vendor/rails/activerecord/lib/active_record/inheritance.rb`, `raise NotImplementedError, "#{self} is an abstract class …"`),
  where `self` renders as `ActiveRecord::Base`. Converge the message (the class's Ruby name) or park with a BLOCKED story.

## Acceptance criteria

- Both rows converge to Rails' assertions; each either passes or is parked with `// BLOCKED: <story>`.
- `parity:test --assertions` lists no activerecord rows outside `has_many_associations_test.rb` and the encryption story.
