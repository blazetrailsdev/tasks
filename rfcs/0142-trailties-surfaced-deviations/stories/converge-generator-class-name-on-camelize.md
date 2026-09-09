---
title: "The controller generator singularizes with classify where Rails camelizes"
status: draft
updated: 2026-09-09
rfc: "0142-trailties-surfaced-deviations"
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

## Deviation

`trails g controller rfc_pages` generates `RfcPageController` — singular — where
Rails generates `RfcPagesController`.

`packages/trailties/src/generators/rails/controller/controller-paths.ts`
derives the class name with `classify`, which singularizes:

```console
$ node -e 'const {classify}=require("./packages/activesupport/dist/inflector.js");
           console.log(classify("rfc_pages"))'
RfcPage
```

Rails does not singularize here. `class_name` is a plain camelize over the
path segments:

```ruby
# railties/lib/rails/generators/named_base.rb:70
def class_name # :doc:
  (class_path + [file_name]).map!(&:camelize).join("::")
end
```

`"rfc_pages".camelize` is `"RfcPages"`. `classify` is Rails' inflector method
for turning a TABLE name into a model class, which is why it singularizes; it
is the wrong one for a generator's class name, and Rails never calls it here.

## Why it matters beyond the name

The controller class name feeds `controllerPath`, so the generated controller
looks for `app/views/rfc_page/` while every route and reference the developer
writes says `rfc_pages`. The name is wrong in the class, the file
(`rfc-page-controller.ts`), the view directory and the test file at once, and
the developer has to rename all four by hand.

It surfaced while fixing the generator's view-directory spelling
(blazetrailsdev/trails#7651) and is unrelated to that change, which is why it
is filed rather than folded in.

## Converged shape

Derive the class name with `camelize`, not `classify`, in `controller-paths.ts`
— `className`, `displayName` and `helperName` all take the same route through
`classify(...)` today and all singularize with it.

Check the other generators for the same call before assuming it is confined to
one file: the scaffold and helper generators derive names the same way.

Rails' own test names the plural case directly
(`railties/test/generators/controller_generator_test.rb`), so the parity suite
gains a case rather than inventing one.

## Acceptance criteria

- `trails g controller rfc_pages` generates `RfcPagesController`, and the
  controller file, view directory and test file all agree with it.
- The derivation uses `camelize`, matching `named_base.rb:70`; `classify` is
  gone from the generator's name derivation.
- A generator test covers a plural multi-word name, which today's suite does
  not — every existing case is singular or single-word.
- Any other generator sharing the derivation is fixed in the same change, or
  named as untouched with the reason.
