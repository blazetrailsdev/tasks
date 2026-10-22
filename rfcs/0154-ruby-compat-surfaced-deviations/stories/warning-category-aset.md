---
title: "Port Warning.[] / Warning.[]= so the :deprecated category can be enabled"
status: draft
updated: 2026-10-22
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

`kernel-warn.ts` keeps `WARNING_CATEGORIES` (`:deprecated` and `:performance` off by default) private, and ruby-compat has no `Warning.[]=` (`rb_warning_s_aset`, `vendor/ruby/v3.3.11/error.c`, next to `rb_warning_category_enabled_p` at `error.c:198`). So nothing can turn `:deprecated` on, and the `rbConstWarnIfDeprecated` warnings from `rbModDeprecateConstant` (trails#9251, `variable.ts`) never print. The tests had to mock `warn` (`variable.trails.test.ts`).

## Acceptance criteria

- ruby-compat exports `Warning.[]` / `Warning.[]=` (MRI `rb_warning_s_aref` / `rb_warning_s_aset`), each with its citation. They read and write the category table `warn` checks, and raise `ArgumentError "unknown category: …"` for a name that isn't a category.
- A test turns `:deprecated` on and sees a deprecated constant read write `constant X::Y is deprecated` to stderr.
