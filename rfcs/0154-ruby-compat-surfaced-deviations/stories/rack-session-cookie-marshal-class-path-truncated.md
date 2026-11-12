---
title: "rbModName answers a truncated path for Rack::Session::Cookie's nested Marshal classes"
status: draft
updated: 2026-11-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Cookie::Base64::Marshal` and `Rack::Session::Cookie::Marshal`
are nested classes in Rack (`rack-session` `lib/rack/session/cookie.rb`),
ported as static class members in `packages/rack-session/lib/cookie.ts:46`
(`static Marshal = class Marshal extends Base64`) and `:104`.

While trails#10023 widened `parity:class-paths` pairing, `--check` reported in
every package that loads rack-session:
`seated Base64::Marshal, generated Rack::Session::Cookie::Base64::Marshal` and
`seated Cookie::Marshal, generated Rack::Session::Cookie::Marshal`. So the path
ruby-compat answers at run time for these static nested classes
(`rbModName`) is truncated to the last two segments, not Rack's full path.
trails#10023 narrowed its generator change so these rows are not generated; the
truncated seat is unchanged.

## Converged shape

`rbModName(Cookie.Base64.Marshal)` is `"Rack::Session::Cookie::Base64::Marshal"`
and `rbModName(Cookie.Marshal)` is `"Rack::Session::Cookie::Marshal"`, from the
generated constant table. Find what writes the two-segment seat and remove it,
then let `parity:class-paths` generate both rows; `--check` stays clean.

## Acceptance criteria

- Both rows are in `packages/rack-session/lib/constants.generated.ts`, and `pnpm parity:class-paths --check` passes.
- A test pins both `rbModName` answers.
