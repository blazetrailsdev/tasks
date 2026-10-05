---
title: "activemodel: Errors#normalize_arguments and include? omit Rails' attribute.to_sym"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8512
claim: "2026-10-05T00:46:36Z"
assignee: "errors-normalize-arguments-omits-attribute-to-sym"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8504. Rails converts the attribute argument of every `Errors` query and
writer to a Symbol, so a String and a Symbol name the same attribute:

- `normalize_arguments` returns `[attribute.to_sym, type, options]`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:489-497`), reached from `add`,
  `added?`, `of_kind?`, `where` and `delete`.
- `include?` is `@errors.any? { |error| error.match?(attribute.to_sym) }` (`errors.rb:202-206`).
- `import`'s override options are `override_options[key].to_sym` (`errors.rb:154-159`).

trails' `normalizeArguments` (`packages/activemodel/src/errors.ts`) returns `attribute` as passed,
and `include` hands it straight to `match`. A trails attribute Symbol is spelled bare (`"name"`),
and PR 8504 made `Error#attribute` answer the Symbol's name for a colon-spelled stored value. The
argument side was left alone, so the two spellings still disagree there:

- `errors.add(":name")` stores `":name"` (read back as `"name"`), but `errors.where(":name")`,
  `errors.added(":name")`, `errors.include(":name")` and `errors.delete(":name")` compare the raw
  `":name"` against `"name"` and miss.

`NestedError`'s constructor already spells the conversion `symbolToS(toSym(attribute))`
(`packages/activemodel/src/nested-error.ts`).

Converged shape: `normalizeArguments` and `include` make Rails' `to_sym` call in that same
spelling, so the argument is the attribute name whichever way it arrives, and `import` converts
its override options the same way.

## Acceptance criteria

- [ ] `Errors#normalizeArguments` returns the Symbol-normalized attribute (`errors.rb:496`), and
      `Errors#include` normalizes before `match` (`errors.rb:204`).
- [ ] `Errors#import`'s `attribute` / `type` overrides are converted as `errors.rb:157` does.
- [ ] A trails test shows `add(":name")` then `where("name")`, `where(":name")`, `added(":name")`,
      `include(":name")` and `delete(":name")` all agree; it fails on the current body.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
