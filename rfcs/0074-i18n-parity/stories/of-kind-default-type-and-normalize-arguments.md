---
title: "of-kind-default-type-and-normalize-arguments"
status: blocked
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-04T23:11:10Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: "Blocked on open PR #6098 (branch error-type-symbols-are-colon-strings), which rewrites Errors#ofKind/#added bodies in packages/activemodel/src/errors.ts and the assertions in errors.test.ts (+226/-226) and validations.test.ts (+39/-43) that this story must update. The story context itself says #6098 'converged the Symbol-vs-String dispatch in both methods and left these two divergences as out of scope' — that convergence is not on main yet, so the colon idiom this story builds on does not exist there. Re-ready once #6098 merges; the work is small (delete the type===undefined arm, default type to ':invalid', route both methods through normalizeArguments, update errors.test.ts:488-489 and validations.test.ts:2062-2063)."
closed-reason: null
---

## Context

`Errors#of_kind?` in Rails is

```ruby
def of_kind?(attribute, type = :invalid)
  attribute, type = normalize_arguments(attribute, type)
  if type.is_a? Symbol
    !where(attribute, type).empty?
  else
    messages_for(attribute).include?(type)
  end
end
```

(`vendor/rails/activemodel/lib/active_model/errors.rb:395-403`).

`packages/activemodel/src/errors.ts` `ofKind` instead declares `type?: string`
and carries an extra leading arm — `if (type === undefined) return
this._errors.some((e) => e.attribute === attribute)` — that Rails does not
have. Rails defaults `type` to `:invalid`, so `of_kind?(:name)` on a record
whose only error is `:blank` is **false**; trails answers **true**. The
divergence is enshrined in trails-only assertions
(`errors.test.ts:488-489`, `validations.test.ts:2062-2063`).

Neither `ofKind` nor `added` calls `normalizeArguments` first, which Rails
does in both (`errors.rb:373`, `errors.rb:396`).

PR #6098 converged the Symbol-vs-String dispatch in both methods to the colon
idiom but left these two divergences alone as out of scope.

## Acceptance criteria

- `ofKind(attribute, type = ":invalid")`: the `type === undefined` arm is
  deleted and the trails-only assertions that depend on it are updated to what
  Rails answers.
- `added` and `ofKind` both run their arguments through `normalizeArguments`
  first, as Rails does.
- No new baseline row.
