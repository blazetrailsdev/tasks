---
title: "ruby-compat: rbFSend finds a predicate under its Ruby or is-spelling across every lookup"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`sendInternal` (`packages/ruby-compat/src/object.ts`) walks the receiver for the name exactly as
sent. A Ruby predicate sent by its Ruby name (`public_send(:odd?)`, `NUMBER_CHECKS` in
`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:14,51`) therefore
misses a TS method spelled `isOdd`. trails#8422 resolved the `is`-spelling at only two places: the
Integer `odd?` / `even?` arm and `OBJECT_METHOD_TABLE`. The general walk still sees the raw name,
because attribute-method proxy targets (`attribute_changed?`) and Thor's
`HashWithIndifferentAccess#method_missing` (`foo?`) answer the Ruby spelling. Mapping every lookup
broke `Thor::CoreExt::HashWithIndifferentAccess > handles magic comparisons`.

Ruby's `rb_f_send` (`vendor/ruby/v3.3.11/vm_eval.c:1330`) finds the method entry by its one name.
trails has two spellings for a predicate, and the send should find whichever entry the receiver
defines.

## Acceptance criteria

- [ ] `sendInternal` looks the Ruby name up first and then its `is`-spelling, across the
      prototype walk, `STRING_METHOD_TABLE`, `TEMPORAL_METHOD_TABLE` and `OBJECT_METHOD_TABLE`.
      `method_missing` receives the name as sent.
- [ ] `rbObjRespondTo` answers the same two spellings.
- [ ] Thor's "handles magic comparisons" and activemodel's "name clashes are handled" still pass.
