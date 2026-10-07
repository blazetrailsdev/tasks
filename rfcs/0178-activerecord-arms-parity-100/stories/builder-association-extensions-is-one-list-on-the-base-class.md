---
title: "activerecord: Builder::Association.extensions is one list on the base class"
status: done
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8624
claim: "2026-10-07T11:33:13Z"
assignee: "unskip-helper-test-default-helpers-and-alternate-dir"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `belongs-to-builder-define-callbacks-calls-super`, whose `defineCallbacks` half shipped in
trails#8474 (`BelongsTo.defineCallbacks` now calls `super`, and the base body iterates
`Association.extensions`).

Rails declares the list once, on the base class's singleton
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:16-19`):

```ruby
class << self
  attr_accessor :extensions
end
self.extensions = []
```

and every reader names `Association.extensions` (`association.rb:67`, `:84`).

`packages/activerecord/src/associations/builder/association.ts:33-52` instead has a static getter that
copies the parent's list onto each subclass on first read, plus an instance getter/setter pair Rails
does not have. A subclass that has read `extensions` once no longer sees an extension registered
afterwards.

## Acceptance criteria

- [ ] `Association.extensions` is one list on the base class, with no copy-on-read getter.
- [ ] The instance `extensions` getter and setter are deleted.
- [ ] Any caller reading `SomeSubclass.extensions` reads `Association.extensions`, as Rails does.
