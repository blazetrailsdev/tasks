---
title: "activemodel: AttributeMethodPattern holds Rails' @regex / @method_name with no camelJoined re-casing"
status: blocked
updated: 2026-10-03
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activemodel"]
deps:
  - camelize-db-columns-preference-and-attribute-method-naming-rule
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-03T10:25:22Z"
assignee: "attribute-method-pattern-drops-camel-joined-recasing"
blocked-by: "Needs a decision on the PUBLIC spelling of generated attribute methods before it can converge. With Rails-spelled patterns (attribute_methods.rb:476-493: prefix 'restore_', suffix '_changed?') and one Ruby-name -> TS-property translation, no single rule reproduces today's names: (1) predicates are spelled three ways today -- 'title?' (quoted literal), titleChanged (bare camel), isSavedChangeToTitle (is-prefix, because saved_change_to_title also exists); (2) a snake_case attribute keeps its name verbatim today (author_nameChanged, isSavedChangeToAuthor_name), which a translation of the joined Ruby name 'author_name_changed?' cannot produce -- it yields authorNameChanged, while the reader stays author_name; (3) method_missing / respond_to? receive TS names and match against the Rails regex, which needs the inverse translation. Any uniform rule renames ~400 call sites (146 *Changed, 115 *BeforeTypeCast, 75 *ForDatabase, 27 *PreviouslyChanged, 16 isSavedChangeTo*/isWillSaveChangeTo*, the 'x?' query readers) plus the generated model typings, far over the PR ceiling and a user-facing API break. AC3 already holds on main: parity:api:arms:report --package=activemodel lists no AttributeMethodPattern row. Unblock by choosing the rule (predicate spelling; whether the attribute segment is camelized) and splitting the rename into per-suffix stories."
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:476-493`:

    @regex = /\A(?:#{Regexp.escape(@prefix)})(.*)(?:#{Regexp.escape(@suffix)})\z/
    @method_name = "#{prefix}%s#{suffix}"
    def match(method_name)
      if @regex =~ method_name
        AttributeMethod.new(proxy_target, $1)
      end
    end
    def method_name(attr_name)
      @method_name % attr_name
    end

`packages/activemodel/src/attribute-methods.ts`'s `AttributeMethodPattern` has an invented
`camelJoined` getter: a prefix not ending in `_` is joined camelCase (`resetName`). `methodName`
upcases the attribute and `match` re-cases `$1` through an invented private `attrName` helper.
trails#8422 converged `match` to the one regex test; the re-casing helper is what is left. The
constructor also carries trails-only `!` / `Bang` handling for `proxyTarget` and `parameters`
(`attribute_methods.rb:476-483` has none).

## Acceptance criteria

- [ ] `AttributeMethodPattern` holds Rails' `@regex` / `@method_name` pair. `match` and `methodName`
      are the bodies above, with no `camelJoined` / `attrName` arms.
- [ ] The camelCase spelling of a generated name (`reset_name` → `resetName`) comes from the
      `docs/ruby-ts-conventions.md` translation at the one place a Ruby method name becomes a TS
      property, not from a per-pattern flag.
- [ ] `pnpm parity:api:arms:report --package=activemodel` lists no `AttributeMethodPattern` row.
