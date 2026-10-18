---
title: "Seat every Tags class and mirror tags.rb's full autoload list"
status: draft
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/namespaces.ts` makes `Tags` an Autoload namespace (trails#9037), but its `eagerAutoload` list
names only the 10 tag classes seated on it with `rbModConstSet` (Select, CollectionSelect, DateSelect, ...). Rails'
`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags.rb:8-48` autoloads `SelectRenderer` and eager-autoloads all of
Base, Translator, CheckBox, ColorField, DateField, DatetimeField, DatetimeLocalField, EmailField, FileField, HiddenField,
Label, MonthField, NumberField, PasswordField, RadioButton, RangeField, SearchField, TelField, TextArea, TextField,
TimeField, UrlField and WeekField as well. Those trails classes (`helpers/tags/*.ts`) are not seated on `Tags`.

## Acceptance criteria

- [ ] Every class in `tags.rb`'s autoload list is seated on `Tags` with `rbModConstSet` and listed in `tagsLoadPath`.
- [ ] `Tags.eagerAutoload` mirrors Rails' list in Rails' order, with `SelectRenderer` as a plain `autoload`.
