---
title: "Drop mini_magick's codegen shims and its activesupport dependency"
status: ready
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-polish
packages: ["mini-magick"]
deps: ["mini-magick-land-on-main"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/mini-magick/src/codegen-runtime.ts` and `codegen-declined.ts` are
generator artifacts; a hand port ships neither. At `5f96afb0a0`:

- `codegen-runtime.ts` exports `inject`, `lines`, `rbAref`, `rbBinop`,
  `rbCallSuper` and `replace` as throwing stand-ins or the generic `rbBinop`
  dispatch, imported by `tool.ts` (`rbCallSuper`, the deprecated subclasses'
  `super(tool, *args)`, `tool.rb:266-270`), `image.ts` (`replace`, `rbAref`,
  `lines`), `image/info.ts` (`rbBinop`), `image.test.ts` (`inject`, `lines`)
  and `tool.test.ts` (`rbBinop`).
- `codegen-declined.ts` is imported and never called.

The Ruby gem depends on no ActiveSupport (`mini_magick.gemspec`); the generated
lib imports `@blazetrails/activesupport` for:

- `getEnv` (`utilities.rb:16-17`, `ENV['PATHEXT']`, `ENV.fetch('PATH')`);
- `Benchmark` (`shell.rb:46`, stdlib `Benchmark.realtime`);
- `Logger` (`configuration.rb:83`, stdlib `Logger.new($stdout)`);
- `eachSlice` (`image.rb`, core `Enumerable#each_slice`).

## Acceptance criteria

- Each shim call is the native form or the ruby-compat function for its Ruby
  method (`rb_call_super`'s ruby-compat port for `super`, `String#lines`,
  `Enumerable#inject`, `String#replace`'s value form per CLAUDE.md "Ruby Strings
  are JS string primitives"), and both shim files are deleted.
- No mini-magick file imports `@blazetrails/activesupport`: `ENV` and
  `each_slice` take their core / ruby-compat form. Stdlib `Logger` and
  `Benchmark` are ported to ruby-compat at their stdlib citations, or, if
  porting them is out of scope, the PR asks the owner and records the ruling;
  the dependency does not stay by default.
- The test count is unchanged.
