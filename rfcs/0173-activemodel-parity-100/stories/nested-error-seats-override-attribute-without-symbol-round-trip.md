---
title: "activemodel: NestedError seats override_options.fetch(:attribute) with no symbolToS(toSym(...)) round trip"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-03T11:55:23Z"
assignee: "bcrypt-generate-salt-reaches-bc-salt"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/nested_error.rb:12-16` seats the override as is:

    @attribute = override_options.fetch(:attribute) { inner_error.attribute }
    @type = override_options.fetch(:type) { inner_error.type }

trails#8422 made `Errors#import` send `to_sym` to both `:attribute` and `:type`, as
`errors.rb:154-161` does. `Error#attribute` is held as the bare name in trails, though:
`normalizeArguments` (`packages/activemodel/src/errors.ts`) omits `errors.rb`'s `attribute.to_sym`.
So `packages/activemodel/src/nested-error.ts` seats `symbolToS(toSym(attribute))`, a conversion
Rails does not make. It also reads the overrides with `??` where Rails uses `fetch` with a block,
so a stored `nil` override falls through to the inner error.

The conversion exists because trails spells an attribute's Symbol two ways: bare in `Error`,
`":name"` coming out of `toSym`. The converged shape spells it one way, so that `import`'s
`to_sym` and `NestedError`'s seat are both identity.

## Acceptance criteria

- [ ] `NestedError`'s constructor is `fetch(overrideOptions, "attribute", block(() => innerError.attribute))`
      and the same for `type`, with no `symbolToS` / `toSym`.
- [ ] `Errors#import` still sends `to_sym` to both keys (`errors.rb:154-161`), a nil override
      still raises, and `errors.added("title", ":invalid")` still matches an imported
      `attribute: "title"`.
- [ ] Whichever side changes (`Error#attribute`'s spelling, or the `to_sym` send for an
      attribute name), the decision is applied repo-wide, not only in `nested-error.ts`.
