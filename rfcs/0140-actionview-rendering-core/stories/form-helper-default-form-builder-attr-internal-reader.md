---
title: "FormHelper default_form_builder attr_internal reader"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FormHelper` declares `attr_internal :default_form_builder`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:122`), and
`default_form_builder_class` reads it through that reader:
`builder = default_form_builder || ActionView::Base.default_form_builder` (`:1626`).

trails (#8171) has no `defaultFormBuilder` reader on the view.
`defaultFormBuilderClass` in `packages/actionview/src/helpers/form-helper.ts` reads the
backing field `this._defaultFormBuilder` directly. That field is seeded by
`assignController` (`packages/actionview/src/helpers/controller-helper.ts`, mirroring
`controller_helper.rb:24,28`) and declared on `Base` (`base.ts:193`).

Converged shape: port `attr_internal :default_form_builder` as a reader/writer pair
named `defaultFormBuilder` over `_defaultFormBuilder`, installed alongside FormHelper,
the way `installControllerInternals` installs `controller` / `request`. Then
`defaultFormBuilderClass` should call `this.defaultFormBuilder`. Take care not to
collide with `ActionView::Base.default_form_builder`, the class-level `cattr_accessor`
with `instance_reader: false` (`form_helper.rb:2764`).

## Acceptance criteria

- The view answers `defaultFormBuilder`, backed by `_defaultFormBuilder`.
- `defaultFormBuilderClass` reads the reader, not the field.
- A test shows a controller's `default_form_builder` reaching `form_with`'s builder class.
