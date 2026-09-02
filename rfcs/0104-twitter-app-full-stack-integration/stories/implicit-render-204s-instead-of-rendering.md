---
title: "Implicit render returns 204 instead of rendering the template or raising MissingTemplate"
status: done
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack", "actionview"]
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: 7364
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Rails-shaped action with no explicit render returns **204 No Content**
instead of rendering its template or raising.

Reproduced on trails `9f8a23690`, Node 24, in an app from `trails new`:

```ts
export class HomeController extends ApplicationController {
  index(): void {}
}
```

```text
HTTP/1.1 204 No Content
x-request-id: 78f97588-0b61-4370-bc6e-9f776dc9cc12
```

`wire-implicit-render-into-controller-dispatch` (#7305) is `done`, so the wiring
landed — but the outcome is still wrong, and wrong in the most expensive way:
silently. Rails' `ImplicitRender#default_render` raises
`ActionView::MissingTemplate` when there is no template for the action (barring
the `any_templates?`/`interactive_browser_request?` arms, which produce a 204
_only_ for a non-browser request with no template at all).

Here the template exists and is compiled, so the correct behaviour is to render
it. Even if it did not exist, an ordinary browser GET should raise
MissingTemplate, not 204.

Likely a consequence of the resolver gap in
`generated-app-cannot-render-its-own-views` — implicit render asks for a
template, gets nothing back, and falls through to the 204 arm instead of the
raise arm. Worth fixing as its own thing regardless: a silent 204 gives no
diagnostic, and it is what made the resolver bug take an hour to localise
rather than a minute.

## Acceptance criteria

- A bare action with a matching template renders it.
- A bare action with no matching template raises `MissingTemplate` for an
  interactive browser request, matching Rails' `default_render` arms.
- The 204 arm fires only where Rails fires it, and is covered by a test that
  names the condition.
