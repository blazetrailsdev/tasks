---
title: "activerecord: Core#inspect_with_attributes interpolates constructor.name where Rails interpolates self.class"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Core#inspect_with_attributes` ends `"#<#{self.class} #{inspection}>"`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:881`), which interpolates
`Module#to_s`: the class path for a named class, `#<Class:0x...>` for an anonymous one.

trails' port (`packages/activerecord/src/core.ts`, `inspectWithAttributes`) interpolates
`(this.constructor as { name: string }).name` — the bare JS class name. That drops the namespace
of a class seated under a Ruby path (`rbSetClassPathString`), and renders an anonymous class as an
empty string (`#< id: nil>`) where Rails prints `#<#<Class:0x...> id: nil>`.

## Acceptance criteria

- [ ] `inspectWithAttributes` interpolates the class through ruby-compat's `rbModToS`
      (`rb_mod_to_s`, `vendor/ruby/v3.3.11/object.c:1710`), as `ClassMethods.inspect` in the same
      file already does for the singleton arm.
- [ ] A test covers an anonymous model class and a class seated under a namespace.

## Verification

```bash
pnpm vitest run packages/activerecord/src/core.test.ts
```
