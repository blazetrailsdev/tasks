---
title: "Port the Html / Builder / :ruby template handlers Handlers.extended registers"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Handlers.extended` (`actionview/lib/action_view/template/handlers.rb:12-18`) is
the hook `extend Template::Handlers` (`template.rb:178`) fires, and it seeds the
registry with FIVE handlers:

```ruby
def self.extended(base)
  base.register_default_template_handler :raw, Raw.new
  base.register_template_handler :erb, ERB.new
  base.register_template_handler :html, Html.new
  base.register_template_handler :builder, Builder.new
  base.register_template_handler :ruby, lambda { |_, source| source }
end
```

`generated-app-cannot-render-its-own-views` (#7364) ported the hook into a
`static {}` block in `packages/actionview/src/template.ts`, but only two of the
five: `raw` (default) and `tse`, trails' `.tse` analogue of `:erb`. `Html`,
`Builder` and the `:ruby` lambda are named in the comment there as unported —
this story is that comment's burndown.

- `Html` is `actionview/lib/action_view/template/handlers/html.rb` — a
  three-line handler wrapping the source in
  `ActionView::OutputBuffer` semantics via `Template::HTML`.
- `Builder` is `actionview/lib/action_view/template/handlers/builder.rb`,
  which needs the `builder` gem's XmlMarkup — likely out of reach, so decide
  and record rather than force it.
- `:ruby` is `lambda { |_, source| source }` — the handler returns the source
  verbatim as code. `Template#compile!` evaluates a handler's return as JS, so
  the trails spelling of a `.ruby` template is questionable; if it has no
  meaning here, say so in a `SKIP_GROUPS` entry rather than leaving a silent
  two-of-five gap.

## Acceptance criteria

- `Html` is ported at `packages/actionview/src/template/handlers/html.ts` and
  registered in the `static {}` block, with a test rendering a `.html` template.
- `Builder` and `:ruby` are either ported and registered, or recorded as
  deliberately-not-mirrored with their reason in `SKIP_GROUPS`
  (`scripts/parity/conventions.ts`) — not left as prose in a code comment.
- The comment in `template.ts`'s `static {}` block is updated to match whatever
  is decided, or deleted if nothing is left unported.
