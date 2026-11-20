---
title: "rbFSend raises NoMethodError for an undef_method'd name"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
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

`TZInfo::Format1::TimezoneDefiner` calls `undef_method :subsequent_rules` (`vendor/tzinfo/v2.0.6/lib/tzinfo/format1/timezone_definer.rb`), so in Ruby `definer.subsequent_rules` raises `NoMethodError` and `respond_to?` answers false. trails#10454 ported it as `Object.defineProperty(TimezoneDefiner.prototype, "subsequentRules", { value: undefined })` (`packages/tzinfo/lib/format1/timezone-definer.ts`). With that port:

- `rbObjRespondTo(definer, "subsequentRules")` answers `false`, matching Ruby.
- A direct call raises `TypeError`, not `NoMethodError`.
- `rbFSend(definer, "subsequentRules")` did not raise at all when checked; MRI's `rb_f_send` raises `NoMethodError` for an undefined method (`vendor/ruby/v3.3.11/vm_eval.c:1330`).

ruby-compat has no `undef_method` (`rb_undef`, `vendor/ruby/v3.3.11/vm_method.c`).

## Acceptance criteria

- [ ] `rbFSend` / `sendInternal` treat an own `undefined` shadow of an inherited method as undefined and raise `NoMethodError` (or go to `methodMissing`), as `rb_f_send` does for an undefined method.
- [ ] A ruby-compat test pins `rbFSend` and `rbObjRespondTo` on such a shadow.
- [ ] `Format1::TimezoneDefiner`'s port uses whatever shape this settles on.
