---
title: "activemodel: Visitor test model omits visitor.rb's attr_reader :password_confirmation"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/test/models/visitor.rb:12` declares

```ruby
attr_reader :password_confirmation
```

beside `attr_accessor :password_digest`. trails' port,
`packages/activemodel/src/test-helpers/models/visitor.ts` (added by
trails#7901), omits that line.

The omission is deliberate but unreceipted. In Ruby, `attr_reader
:password_confirmation` defines only the reader, so the writer
`password_confirmation=` that `InstanceMethodsOnActivation` contributes
(`activemodel/lib/active_model/secure_password.rb:199`,
`attr_accessor :"#{attribute}_confirmation"`) still resolves. In JS a class-body
accessor is a get/set PAIR: declaring only a getter for `passwordConfirmation`
on `Visitor.prototype` shadows the module's accessor wholesale and DELETES the
setter, which Ruby keeps.

The converged shape is therefore both halves — a getter reading the backing
field and a setter delegating to the module's carrier (the object
`include()` splices below `Visitor.prototype`, see
`packages/ruby-compat/src/include.ts`) — which reproduces Ruby's net behaviour
rather than a reader-only accessor.

Nothing in `secure_password_test.rb` reads `@visitor.password_confirmation`
today, so this is invisible at present; it is filed so the test model matches
its `.rb` line for line and so a future Rails test that does read it is not
silently broken.

## Acceptance criteria

- [ ] `visitor.ts` carries `password_confirmation`'s reader, mirroring
      `visitor.rb:12`, without removing the writer
      `has_secure_password` contributes.
- [ ] `secure_password_test.rb` stays at 41/41 with 0 assertion mismatches.
