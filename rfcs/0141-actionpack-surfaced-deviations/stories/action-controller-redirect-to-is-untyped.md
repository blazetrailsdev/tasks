---
title: "action-controller-redirect-to-is-untyped"
status: done
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8305
claim: "2026-09-30T20:53:19Z"
assignee: "action-controller-redirect-to-is-untyped"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Redirecting#redirectTo`
(`packages/actionpack/src/action-controller/metal/redirecting.ts:26`) is typed
`redirectTo(options?: unknown, responseOptionsAndFlash?: Record<string, unknown>): unknown`
on a controller. Rails' `redirect_to(options = {}, response_options = {})`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:103`)
takes a String URL, a record, a Hash of `url_for` options, a Proc or `:back`.
`response_options` takes `status`, `allow_other_host` and flash types (`notice`, `alert`,
plus any `add_flash_types`).

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195. The scaffold calls `this.redirectTo(this.post, { notice: "...", status: "see_other" })`.

## Converged shape

`options: string | ToModel | Record<string, unknown> | (() => string)`.
`responseOptions: { status?: StatusName | number; allowOtherHost?: boolean; notice?: string; alert?: string; flash?: Record<string, unknown> }`,
widened by the controller's declared flash types. The return is Rails' (`self.response_body`), typed.

## Acceptance criteria

- [ ] A misspelled response option (`statsu:`) or a non-status `status` is a type error.
- [ ] Type tests cover the option forms above.
