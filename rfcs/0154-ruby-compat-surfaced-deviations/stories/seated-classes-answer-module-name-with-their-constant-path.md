---
title: "Seated activesupport classes answer Module#name with their constant path"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Module#name` (`rb_mod_name`, `vendor/ruby/v3.3.11/variable.c:122-127`) is the class's full constant path, so `ActiveSupport::Duration.name` is `"ActiveSupport::Duration"`. In trails, `rbModName` (`packages/ruby-compat/src/object.ts`) answers the `classpaths` entry that `registerConstant` / `rbModConstSet` writes, or else the bare JS `klass.name`.

At trails#9019, 99 of the 119 seated activesupport/activejob exports had no classpath, for example `Duration`, `Logger`, `Notifications::Fanout`, `Cache::MemoryStore` and the `NumberHelper` converters. `rbModName` gives the bare name for every one of them. trails#9019 made `rbModToS` fall back to the `static toString` seat, so `to_s` is right, but `name` (and anything that reads `rbModName`, such as `rbObjClassname` through branding paths and constantize round-trips) still disagrees with Ruby.

## Converged shape

Each of those classes is seated on its Rails namespace, so `rbModName(klass) === String(klass)`. The seat is `rbModConstSet` on the `ActiveSupport` namespace object, or the defining module's namespace (CLAUDE.md, "Call-time constant resolution"), following Rails' own nesting: `module ActiveSupport; class Duration` (`activesupport/lib/active_support/duration.rb:13`).

## Acceptance criteria

- [ ] A test asserts `rbModName(klass) === String(klass)` for every seated activesupport and activejob export (extend `packages/activejob/src/class-to-string-seat.trails.test.ts`).
- [ ] Each unregistered class is seated at its defining module, not in a central list.
