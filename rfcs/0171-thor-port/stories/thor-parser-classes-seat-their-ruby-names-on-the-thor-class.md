---
title: "Seat Thor parser class paths on the Thor class, including Option and Options"
status: draft
updated: 2026-10-01
rfc: "0171-thor-port"
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

`Thor::Argument` and `Thor::Arguments` read their Ruby class name:
`self.class.name.split("::").last` (`vendor/thor/v1.3.2/lib/thor/parser/argument.rb:9`,
`parser/arguments.rb:191`). The ports seat it with
`rbSetClassPathString(Argument, { name: "Thor" }, "Argument")` and the same for
`Arguments` (`packages/trailties/src/thor/parser/argument.ts`, `arguments.ts`,
trails#8347). The `under` argument is an object literal, because no `Thor`
class object exists yet (`port-thor-class-dsl`).

Two gaps follow. The literal is not the `Thor` constant, so the path is not
derived from the class the Ruby nests these in. And a subclass with no seat of
its own falls back to its JS `name` in `rbModName`, which a minifier can
rename: `Thor::Option` (`parser/option.rb`) and `Thor::Options`
(`parser/options.rb`) both reach these two reads, for `"Option name can't be nil."`
and `"No value provided for required options '...'"`.

## Acceptance criteria

- [ ] `Argument`, `Arguments`, `Option` and `Options` are each seated with
      `rbSetClassPathString(Klass, Thor, "Klass")` against the real `Thor`
      class, and the `{ name: "Thor" }` literals are gone.
- [ ] A test renames each class's JS `name` and still reads `Option` /
      `options` in the two messages, as `argument.trails.test.ts` and
      `arguments.trails.test.ts` do for the base classes.
