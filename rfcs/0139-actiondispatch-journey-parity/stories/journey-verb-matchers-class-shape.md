---
title: "VerbMatchers builds a class per verb, as Rails does"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`VerbMatchers` in `packages/actionpack/src/action-dispatch/journey/route.ts:15-58`
does not have Rails' shape. Rails
(`actionpack/lib/action_dispatch/journey/route.rb:12-46`) `class_eval`s a real
CLASS per verb inside `module VerbMatchers`:

```ruby
VERBS = %w{ DELETE GET HEAD OPTIONS LINK PATCH POST PUT TRACE UNLINK }
VERBS.each do |v|
  class_eval <<-eoc, __FILE__, __LINE__ + 1
    class #{v}
      def self.verb; name.split("::").last; end
      def self.call(req); req.#{v.downcase}?; end
    end
  eoc
end
```

trails instead builds anonymous object literals through an invented
`makeStaticMatcher(verb)` factory (`route.ts:29-35`), and `All` is an object
literal rather than `class All` with `self.call` / `self.verb`
(`route.rb:36-39`). The factory is a helper Rails does not have, and the
per-verb constants (`VerbMatchers::GET`, …) that Rails exposes do not exist,
so nothing can name one.

Note the two halves that ARE already converged and must stay: `VERB_TO_CLASS`
carries Rails' three keys per verb plus the `:all` seed (`route.rb:41-45`), and
`Route.verbMatcher` fetches it with the `Unknown` block (`route.rb:49-53`) —
both landed in #7625.

Also note `self.call(req)` is `req.get?` in Rails — a predicate on the request —
where trails compares `req.requestMethod === verb`. Converge that arm too if
`VerbRequest` grows the predicates; otherwise cite the gap.

## Acceptance criteria

- One named class per verb, each with `verb` and `call` as static members, in
  Rails' order, replacing `makeStaticMatcher`.
- `All` is a class with static `call` / `verb`, matching `route.rb:36-39`.
- `VERB_TO_CLASS` keys and `Route.verbMatcher` are unchanged.
- `pnpm parity:api:extra --package actiondispatch` shows no new novel name, and
  `pnpm parity:api:calls` / `:args` stay green with no new baseline row.
