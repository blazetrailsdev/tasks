---
title: "Declare ActionController's config seats with classAttribute / mattrAccessor"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actioncontroller` reports 41 missing rows that are
all one shape: Rails declares a config seat with `class_attribute` or
`mattr_accessor` / `cattr_accessor`, and trails has a plain static field, so the
generated reader, writer (`setX`) and predicate (`x?`) never exist. Paths are
under `vendor/rails/v8.0.2/actionpack/lib/action_controller/`:

| Seat                          | Rails declaration                                          | Rows                                                                      |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `etaggers`                    | `class_attribute`, `metal/conditional_get.rb:15`           | 15 (on base, conditional_get, etag_with_flash, etag_with_template_digest) |
| `etag_with_template_digest`   | `class_attribute`, `metal/etag_with_template_digest.rb:31` | 9                                                                         |
| `middleware_stack`            | `class_attribute`, `metal.rb:288`                          | 6                                                                         |
| `raise_on_open_redirects`     | `mattr_accessor`, `metal/redirecting.rb:17`                | 6                                                                         |
| `include_all_helpers`         | `class_attribute`, `metal/helpers.rb:71`                   | 3                                                                         |
| `always_permitted_parameters` | `cattr_accessor`, `metal/strong_parameters.rb:263`         | 2                                                                         |

(`_wrapper_options` is `port-wrap-parameters-class-macro`, RFC 0141.)

trails, e.g. `static includeAllHelpers = true` at
`packages/actionpack/src/action-controller/base.ts:263`. The idiom `parity:api`
credits is already in the package: `cattrAccessor.call(this, "rescueResponses", { default: … })`
at `action-dispatch/middleware/exception-wrapper.ts:72`, and `classAttribute()`
from `@blazetrails/activesupport` (CLAUDE.md § "Module mixins").

## Acceptance criteria

- Each seat is declared with the Rails primitive, in the file mirroring the Rails
  declaration, with the Rails default and options (`instance_accessor: false`
  and friends). Every reader and writer in the package goes through it.
- `class_attribute` seats keep Rails' semantics: reads walk the class chain,
  writes are local to the class that writes.
- `pnpm parity:api --package actioncontroller` reports none of these 41 rows.
