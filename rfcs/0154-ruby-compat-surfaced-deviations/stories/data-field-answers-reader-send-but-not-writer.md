---
title: "A declared data field answers send(:name) but not send(:name=): attr_accessor's halves disagree"
status: draft
updated: 2026-10-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A TS class field is the port of Ruby's `attr_accessor`. ruby-compat's
`basicObjRespondTo` and `sendInternal` (`packages/ruby-compat/src/object.ts`)
treat such a field as a READER: a zero-argument `rbFSend(obj, "name")` answers
the field's value and `rbObjRespondTo(obj, "name")` is true. They do not treat
it as a WRITER: `rbFSend(obj, "name=", v)` raises `NoMethodError` and
`rbObjRespondTo(obj, "name=")` is false unless the class defines a setter
accessor or a `setName` method. In Ruby `attr_accessor :name` defines both
(`vendor/ruby/v3.3.11/object.c` `rb_mod_attr_accessor`).

trails#8577 hit this in `helper_method`: Rails' forwarder is
`controller.send(:'name=', ...)`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:128-145`),
and `helper_attr :name`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/helpers.rb:76-78`)
on a controller whose `name` is a plain field now raises `NoMethodError` when a
view assigns it. A general data-field writer arm in `rbFSend` was tried in that
PR and rejected in review because it disagreed with `rbObjRespondTo`.

## Acceptance criteria

- Decide, with the callers that depend on it listed (`assign_attributes`'
  `respond_to?("#{k}=")` among them), whether a declared data field answers
  `name=` in BOTH `basicObjRespondTo` and `sendInternal`, or in neither, and
  make the reader and writer halves agree.
- A controller attribute declared as a field and registered with
  `helperAttr("name")` is writable from a view, or the port of
  `attr_accessor` on controllers is an accessor pair and the tests say so.
