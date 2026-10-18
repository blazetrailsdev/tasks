---
title: "template-marshal-dump-load"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TestERBTemplate#test_template_is_marshalable`
(`vendor/rails/v8.0.2/actionview/test/template/template_test.rb:286-291`) round-trips a
template through `Marshal.dump` / `Marshal.load`. Rails' `ActionView::Template#marshal_dump` /
`#marshal_load` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:387-394`) dump
`[@source, @identifier, @handler, @compiled, @locals, @virtual_path, @format, @variant]`.

trails' `packages/actionview/src/template.ts` has neither method, and `Template` is not seated
on the `ActionView` namespace (`rbModConstSet(ActionView, "Template", Template)`), so ruby-compat's
`Marshal.load` raises `undefined class/module Template`. The handler (`Tse`) must also be seated
at `ActionView::Template::Handlers::ERB`'s trails spelling so it can be dumped.

## Acceptance criteria

- [ ] `Template#marshalDump` / `#marshalLoad` ported at `template.rb:387-394`.
- [ ] `Template` and its handlers are seated on the `ActionView` namespace so `path2class` resolves them.
- [ ] `it("template is marshalable")` in `packages/actionview/src/template/template.test.ts` is un-skipped and passes.
