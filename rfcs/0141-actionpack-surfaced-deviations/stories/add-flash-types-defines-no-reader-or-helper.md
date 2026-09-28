---
title: "add_flash_types defines no notice/alert reader or helper_method, so <%= notice %> raises"
status: done
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8220
claim: "2026-09-28T16:29:17Z"
assignee: "add-flash-types-defines-no-reader-or-helper"
blocked-by: null
closed-reason: null
---

## Context

Found re-verifying the README quickstart (trails#8195) on `main` at `bace3edab4`.
The ported scaffold views (`scaffold-views-diverge-from-rails-erb-templates`, trails#8219)
open with `<p style="color: green"><%= notice %></p>`, as Rails' `index` / `show`
templates do. Every such page returns 500:

```text
ActionView::Template::Error (notice is not defined)
```

Rails: `ActionController::Flash` declares `class_attribute :_flash_types` and calls
`add_flash_types(:alert, :notice)` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/flash.rb:10,13`).
`add_flash_types` (`:34-45`) `define_method(type) { request.flash[type] }` and
`helper_method(type)`, so `notice` / `alert` are controller methods and view helpers.

trails ports this as an invented `FlashTypeRegistry` class
(`packages/actionpack/src/action-controller/metal/flash.ts:1`, exported at
`action-controller/index.ts:91`). It records type names and extracts them from
`redirect_to` options, but defines no reader and registers no helper.

`metal-invented-registries-fold-into-rails-state` (RFC 0162, draft) plans to fold
`FlashTypeRegistry` into Rails' state wholesale. This story is the user-visible slice,
and can land first or be absorbed by it.

## Acceptance criteria

- `addFlashTypes` is ported per `flash.rb:34-45`: for each new type it defines a controller
  reader returning `request.flash[type]`, registers it with `helperMethod`, and appends to
  `_flashTypes`. `alert` / `notice` are registered on `ActionController::Base`.
- A controller test reads `this.notice` after a `redirectTo(..., { notice })` round trip, and a
  view test renders `<%= notice %>`. Port the matching `flash_test.rb` cases where they exist.
