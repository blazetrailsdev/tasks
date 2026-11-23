---
title: "bundler-require-rescue-and-gem-require-error"
status: draft
updated: 2026-11-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/lib/bundler.ts` `Bundler.require` vs `Bundler::Runtime#require`
(`vendor/ruby/v3.3.11/lib/bundler/runtime.rb:55-79`):

- `bundler.ts:52-56` throws `LoadError` (path = name) when the package directory is missing;
  Bundler rescues that shape at `runtime.rb:67` (`e.path == required_file`, no autorequire) and moves on.
- `bundler.ts:84` re-throws a non-LoadError raised while importing the entry raw; Bundler wraps it
  in `Bundler::GemRequireError` "There was an error while trying to load the gem '#{file}'."
  (`runtime.rb:61-64`).

## Acceptance criteria

- A missing package directory is skipped as Bundler skips it.
- A non-LoadError from the entry import raises `Bundler::GemRequireError` with Bundler's message.
- Tests cover both arms.
