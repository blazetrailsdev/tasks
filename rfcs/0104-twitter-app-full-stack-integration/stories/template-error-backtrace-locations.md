---
title: "Template::Error#backtrace_locations over a settled parsed-frame type"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
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

`port-template-error-annotated-source-code` ported the `Template::Error`
cluster (`packages/actionview/src/template/error.ts`, per
`vendor/rails/actionview/lib/action_view/template/error.rb:160-254`) including
`#backtrace` (`error.rb:181-183`), but NOT its neighbour
`#backtrace_locations` (`error.rb:185-187`, `@cause.backtrace_locations`).

Ruby's `Exception#backtrace_locations` answers an array of
`Thread::Backtrace::Location` — parsed objects with `lineno`, `label`,
`path`. A JS `Error` carries only `stack`, a formatted string; V8 exposes
structured `CallSite`s solely through `Error.prepareStackTrace` at CAPTURE
time, which is a process-wide hook, not something a per-error reader can ask
for after the fact. So there is no object for `@cause.backtrace_locations` to
return, and the two places trails would need one already parse the string
themselves:

- `ExceptionWrapper`'s `backtraceLocationFor` /`labelFor`
  (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`),
  which is Rails' `build_backtrace` reading `loc.label`
  (`actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:263-264`).
- `Base`'s `argument_error.backtrace_locations[1]`
  (`actionview/lib/action_view/base.rb:271`), unported.

The decision this story has to make is therefore not "port a one-liner" but
"what is trails' `Thread::Backtrace::Location`" — a shared parsed-frame type
with one parser, or a documented permanent gap. Doing it inside the
annotated-source story would have meant inventing a cross-package abstraction
for a method with no trails consumer, which `CLAUDE.md`'s "no abstraction Rails
does not have" rule forbids.

## Acceptance criteria

- Either `Template::Error#backtraceLocations` (`error.rb:185-187`) exists over
  a settled parsed-frame type, with `ExceptionWrapper`'s `backtraceLocationFor`
  / `labelFor` converged onto that one parser rather than keeping their own,
  or the gap is recorded with a receipt naming what V8 cannot supply after
  capture.
- Whichever way it lands, `actionview/base.rb:271`'s
  `backtrace_locations[1]` read has a stated path forward.
