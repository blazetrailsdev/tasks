---
title: "ruby-compat: PrettyPrint#text takes only a string primitive, so Core#pretty_print converts the mask"
status: draft
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
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

Left by trails#8726. Rails' `Core#pretty_print`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:810-811`) is
`value = attribute_for_inspect(attr_name); pp.text value`, and the value is an `InspectionMask`
(`DelegateClass(::String)`, `core.rb:858-862`) for a filtered attribute. Ruby's
`PrettyPrint#text(obj, width = obj.length)` (`vendor/ruby/v3.3.11/lib/prettyprint.rb:182-196`)
takes any object that answers `length` and appends it with `@output << obj`.

trails' `PrettyPrint#text` (`packages/ruby-compat/src/pretty-print.ts:81`) is typed
`text(obj: string, width = obj.length)`, and `Text#add` / `objs` are `string` too. So
`packages/activerecord/src/core.ts` `prettyPrint` calls `pp.text(String(value))`, a conversion
Rails' body does not make at that line.

## Acceptance criteria

- [ ] `PrettyPrint#text` and `Text#add` accept what `prettyprint.rb:182` accepts (a string or a
      String delegator), converting where Ruby's `<<` does.
- [ ] `core.ts` `prettyPrint` is `pp.text(value)` with no `String(...)`.
- [ ] `filter-attributes.test.ts` "filter_attributes on pretty_print" cases stay green.
