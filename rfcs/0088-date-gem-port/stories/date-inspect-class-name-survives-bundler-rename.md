---
title: "Date#inspect names its class without reading constructor.name"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6495
claim: "2026-08-13T21:57:10Z"
assignee: "converge-fixtures-encrypted-attributes-present"
blocked-by: null
closed-reason: null
---

## Context

`Date#inspect` (`packages/date/src/date.ts`) renders the class name with
`this.constructor.name`, standing in for `mk_inspect`'s `rb_obj_class(self)`
argument (`vendor/date/ext/date/date_core.c:7032-7041`):

    return `#<${this.constructor.name}: ${this.toS()} ...`

It is correct under `tsc` and correct at runtime today, but it is a class NAME
read at runtime: a bundler that renames classes changes the output. That is not
hypothetical in this repo — the esbuild class-rename behaviour already bit the
canonical-model import path (`project_canonical_import_esbuild_class_rename`),
and `Date#inspect`'s output is asserted byte-for-byte against MRI in
`date.trails.test.ts` and quoted inside `FrozenError` messages
(`can't modify frozen Date: #<Date: ...>`), so a rename corrupts user-visible
strings, not just a debug aid.

`DateTime` subclasses `Date` and must inspect as `#<DateTime: ...>`, so a single
hard-coded literal on `Date` is not enough — the value has to vary per class the
way `rb_obj_class(self)` does.

PR #6464 (`date-inspect-spells-infinite-start-as-inf`) fixed the reform-start
spelling in this same method and flagged this as the remaining fragility.

## Converged shape

Give each class an explicit, minifier-proof class-name seat — a static literal
(`static _railsClassName = "Date"` / `"DateTime"`, the convention already used in
`packages/activerecord`) read through `this` so subclasses answer their own name
— and use it in `inspect` in place of `this.constructor.name`.

## Acceptance criteria

- [ ] `Date#inspect` does not read `this.constructor.name`.
- [ ] `new Date(2001,2,3).inspect()` is `#<Date: ...>` and the `DateTime` form is
      `#<DateTime: ...>`, both unchanged against `ruby -rdate`.
- [ ] The spelling survives a minified/renaming bundle (cover it the way the
      canonical-model rename note describes, or assert against the built bundle).
- [ ] `pnpm vitest run packages/date/src` green.
