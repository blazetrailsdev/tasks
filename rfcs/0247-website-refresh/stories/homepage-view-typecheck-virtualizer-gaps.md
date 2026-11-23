---
title: "homepage-view-typecheck-virtualizer-gaps"
status: claimed
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-23T13:52:26Z"
assignee: "homepage-view-typecheck-virtualizer-gaps"
blocked-by: null
closed-reason: null
---

## Context

Findings from attempting `homepage-example-view-typechecks`. Plain `tsc` can never see readers that a static `hasOneAttached` / `hasRichText` call generates. The only definer-side typing is activerecord-cli's model virtualizer (`trails-tsc` bin, `packages/activerecord-cli/lib/type-virtualization/`). Three gaps keep `examples/homepage/app/views/posts/show.html.tse` from typechecking under it:

1. `collectBaseDescendants` (`transitive-extends-walker.ts`, `walkClass`) treats `Base` as a framework class, because ActionText's `declare module "@blazetrails/activerecord" { interface Base … }` merges a declaration from `packages/actiontext/` into `Base`'s symbol, and the `framework` check is `sym.declarations.some(...)` over every declaration. Restricting that check to `ts.isClassDeclaration(decl)` fixes it: `coverImage` then types as `One`.
2. `hasRichText` is not a walked call (`walker.ts` `readThisCall`, `synthesize.ts` `renderRuntimeCall`). Rails defines `#{name}`, `#{name}?`, `#{name}=` and the `rich_text_#{name}` association (`vendor/rails/v8.0.5.2/actiontext/lib/action_text/attribute.rb`).
3. `One`'s delegated members are `Partial<…>` (`packages/activestorage/lib/attached/one.ts`, `DelegatedAttachment`), so `post.coverImage.variant(...)` is TS2722. Rails' `delegate_missing_to :attachment, allow_nil: true` (`one.rb:27`) answers nil for any call on an unattached One. Converging that means making the runtime trap return a nil-answering function and typing members as `(...a) => R | null`.

`examples/homepage/scripts/check-hero.mjs` runs plain `typescript-5` tsc, so it would also need to compile through the virtualizing `trails-tsc`, and `hero/errors.json` must still match.

## Acceptance criteria

- The three gaps above are fixed at their definers (activerecord-cli walker, actiontext synthesis, activestorage `One`).
- The unedited `examples/homepage` views typecheck under `trails-tsc`, and `check:hero` fails on any error from the unedited compile.
