---
title: "Reconcile trailmap's kebab view directories with the underscored ones trails now generates"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## The workaround, and why it is now the odd one out

`app/controllers/application-controller.ts` overrides the framework's view
prefix derivation so trailmap's kebab-case view directories render implicitly:

```ts
static controllerPath(): string {
  return super.controllerPath().replace(/_/g, "-");
}
```

It shipped in trailmap#21 because trails derived the prefix with Rails'
`underscore` (`packages/actionpack/src/abstract-controller/base.ts`,
`controllerPath`), so `RfcPagesController` looked under `app/views/rfc_pages/`
while every other filename here is kebab-case.

**trails has since decided the other way, and the decision was informed by
this.** blazetrailsdev/trails#7651 found that trails' own controller generator
wrote `app/views/rfc-pages/` (`viewBase` derived with
`dasherize(underscore(...))` in
`packages/trailties/src/generators/rails/controller/controller-paths.ts`) while
the lookup asked for `rfc_pages/` — a generated multi-word controller raised a
missing template for its own views. The fix made the GENERATOR write the
underscored directory, matching Rails
(`railties/lib/rails/generators/erb/controller/controller_generator.rb`,
`File.join("app/views", class_path, file_name)` over an underscored
`class_path`).

Seven review rounds established why the framework will not translate between
the two spellings: nothing distinguishes a directory _named_ with a hyphen from
the kebab alias of an underscored one — they are the same string — so an alias
cannot hold Rails' invariant that a template's virtual path comes from its
physical location. The last attempt built two `Template` objects for one file:

```text
builtTemplates virtualPaths: [ 'rfc_pages/show', 'rfc-pages/show' ]
```

So trailmap is now the only place that spells these directories with a hyphen,
and it holds an override to make that work.

## What to decide

Either is defensible; leaving it undecided is not, because a new page's author
reads `CLAUDE.md`, sees kebab-case, and inherits an override whose reason has
moved.

1. **Drop the override, rename to `app/views/rfc_pages/` and
   `app/views/story_pages/`.** trailmap then matches what `trails g controller`
   scaffolds and what every other trails app will hold. Costs one snake_case
   exception in a kebab-case tree — the exception Rails' lookup dictates.
2. **Keep the override**, and say in `CLAUDE.md` that trailmap deliberately
   diverges from what the generator writes, so nobody "fixes" it later by
   deleting three lines and breaking every page.

If option 1, `derive-kebab-case-view-prefixes` (RFC 0140) should be closed with
the reason, since its premise was that an app needs kebab-case here.

## Acceptance criteria

- One option is applied, and `CLAUDE.md`'s view-directory rule states the
  decision and why — the current text still describes the exception as
  temporary and pending RFC 0140.
- `test/views/view-directory-names.test.ts` asserts whichever spelling is
  chosen, including that the override is present or absent as decided.
- If the override is kept, a comment or test names the fact that
  `trails g controller` writes the OTHER spelling, so the mismatch is not
  rediscovered as a bug.
