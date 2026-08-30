---
title: "param-drift-actioncontroller-structural-residue"
status: draft
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-actioncontroller` took actioncontroller from 43 param-name rows to
11 and enrolled it in `pnpm parity:api:params` at a mark of 11. Every survivor is
a structural port divergence rather than a rename.

### 1. `base.rb#respond_to` — 1 row, Ruby's `*mimes` dropped

`respond_to(*mimes, &block)` (`actionpack/lib/action_controller/metal/
mime_responds.rb:191`); trails is `respondTo(block)`
(`packages/actionpack/src/action-controller/base.ts:396`) — the splat is not
ported at all, so the ported block is charged as a rename of it. Same class as
`param-drift-positional-misalignment-is-a-dropped-parameter`.

### 2. `metal/flash.rb#redirect_to` @1 — 1 row, two Ruby spellings, one TS method

`ActionController::Base#redirect_to(options = {}, response_options = {})`
(`metal/redirecting.rb:75`) and `Flash#redirect_to(options = {},
response_options_and_flash = {})` (`metal/flash.rb:53`) name their second
parameter differently; the module override is one method in trails
(`base.ts:363`). Whichever spelling the TS carries, the other Ruby definition is
charged a rename. It clears only once `Flash` is a separate mixin layer whose
`redirect_to` is its own declaration.

### 3. `metal/logging.rb#log_at` — 2 rows, the wrong `log_at`

Rails' `ActionController::Logging::ClassMethods#log_at(level, **options)`
(`metal/logging.rb:17`) is a class macro that installs an `around_action`.
trails' `logAt(logger, level, fn)`
(`packages/actionpack/src/action-controller/metal/logging.ts:23`) is
ActiveSupport's `Logger#log_at` — a different method that happens to share the
name and the file. The rows clear when the ActionController macro is ported (the
existing `createLogAtFilter` is the closest trails has) and the logger helper
moves to activesupport.

### 4. `metal/allow_browser.rb#initialize` — 1 row, the port holds a UA string

`ActionController::AllowBrowser::BrowserBlocker.new(request, versions:)`
(`actionpack/lib/action_controller/metal/allow_browser.rb:80`) holds the request
and reads `@request.user_agent` off it. trails takes the user-agent string
itself (`packages/actionpack/src/action-controller/metal/allow-browser.ts:23`,
`this._userAgent = userAgentString`), so spelling the parameter `request` would
misdescribe a `string`. Same shape as
[[param-drift-actiondispatch-structural-residue]]'s `http/headers.rb#initialize`.

### 5. `metal/request_forgery_protection.rb` storage strategies — 3 rows, the port holds the store, not the request

`SessionStore#fetch(request)` / `#store(request, csrf_token)` / `#reset(request)`
(`metal/request_forgery_protection.rb:320-330`) and `CookieStore`'s three
(`:338-362`) all take a request and reach through it —
`request.session[:_csrf_token]`, `request.cookie_jar.encrypted[@cookie_name]`.
trails' `SessionStore` takes the session hash and `CookieStore` the cookie hash
directly (`packages/actionpack/src/action-controller/metal/
request-forgery-protection.ts:164-197`), indexing them with `this._tokenKey` /
`this._cookieName`, so spelling either parameter `request` would misdescribe the
value — and would read wrong beside the `read`/`write` helpers next to it. Same
shape as [[param-drift-actiondispatch-structural-residue]]'s
`http/headers.rb#initialize`; the `csrf_token` slot IS the token and already
carries Rails' name. `CookieStore#fetch` also has a session-id check trails does
not port, so the two converge together.

### 6. `metal/strong_parameters.rb#deep_merge?` — 1 row, a predicate colliding with the method it guards

`Parameters#deep_merge?(other_hash)` (`metal/strong_parameters.rb:1027`, `:nodoc:`)
is the DeepMergeable hook asking whether a value should be merged recursively —
a different method from `deep_merge`. Under `docs/ruby-ts-conventions.md` a `?`
predicate drops the mark, so it normalises onto the TS name `deepMerge`, which
`packages/actionpack/src/action-controller/metal/strong-parameters.ts:294`
already uses for the port of `ActiveSupport::DeepMergeable#deep_merge(other,
&block)` (`activesupport/lib/active_support/deep_mergeable.rb:29`). trails has no
port of the predicate itself, so the comparer scores the alias against
`deepMerge(other)` and reports `other` as a rename of `other_hash`.

`param-drift-actioncontroller` briefly spelled the parameter `otherHash` to clear
this row; review caught that it adopts the WRONG method's identifier — the
implementing method names it `other`, as trails' own
`packages/activesupport/src/deep-mergeable.ts:43` already does — so it was
reverted to `other` and the collision recorded here. (Rails' rdoc at
`strong_parameters.rb:168-191` documents Parameters' facing signature as
`deep_merge(other_hash, &block)`, but that is a `# :method:` call-seq comment,
not a `def`; the body being ported is DeepMergeable's.) Same shape as
[[param-drift-rack-structural-residue]]'s `headers.rb#key?` row, and the two
should be decided together.

### 7. `template_assertions.rb#assert_template` — 2 rows, a different signature

Rails' `assert_template(options = {}, message = nil)`
(`actionpack/lib/action_controller/template_assertions.rb:7`) raises
`NoMethodError` pointing at rails-controller-testing. trails'
`assertTemplate(rendered, expected)`
(`packages/actionpack/src/action-controller/template-assertions.ts:8`) is a real
assertion taking the rendered list first, so the Rails identifiers describe
different values in different slots. Renaming would misdescribe both arguments.

## Acceptance criteria

- Every position carries the Rails identifier, verified against `vendor/rails`
  at the cited `file:line`, or the one that genuinely cannot is a
  `pnpm tasks block` naming the language shortcoming.
- actioncontroller's mark in `scripts/api-compare/param-name-mark.json` is
  narrowed with `pnpm parity:api:params:tighten` (never rewritten upward), and
  `pnpm parity:api:params` reports actioncontroller 0/0.
- No test renamed; `pnpm parity:api` methods/arity unmoved, `parity:api:calls`
  and `parity:api:calls:args` no new row.
