---
title: "trails-tsc-type-checks-tse-templates"
status: in-progress
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: trails#8296
claim: "2026-09-30T18:25:35Z"
assignee: "trails-tsc-type-checks-tse-templates"
blocked-by: null
closed-reason: null
---

## Context

`trails-tsc` types models from the schema, but it does not type-check
templates. A `.tse` view can call a helper with the wrong argument type and a
generated app's `pnpm build` stays green.

Probe, on a fresh `trails new blog` + `generate scaffold Post title:string body:text`
app at `main` `53a6249ae6` (found while writing the README for PR #8195):

1. Add `readingTime(words: number): string` to `app/helpers/posts-helper.ts`'s
   `PostsHelper`.
2. Add `<p><%= readingTime(post.title) %></p>` to `app/views/posts/_post.html.tse`
   (`post.title` is `string | null`).
3. `npx trails-tsc-views build --views app/views` compiles the views into
   `.trails/views/**/*.tse.ts`, via `packages/trails-tsc/src/plugins/tse.ts`.
4. `pnpm build` (`trails-tsc --schema db/schema.ts`) exits 0.

There are two reasons:

- **The compiled views are outside the build.** The generated `tsconfig.json`
  includes `app`, `config`, `db` and `.trails/template-registry-augmentation.d.ts`
  (`packages/trailties/src/generators/app-generator.ts:306`), not `.trails/views`.
- **Even when included, nothing is in scope.** Running
  `trails-tsc --schema db/schema.ts` over a tsconfig that adds
  `.trails/views/**/*.ts` gives 45 errors, all `TS2304 Cannot find name`:
  `contentFor`, `stylesheetLinkTag`, `formWith`, `pluralize`, `domId`,
  `readingTime` and the local `post`. The generated `render(context, locals)`
  calls helpers and locals as bare identifiers, and its `RenderContext`
  (`tse.ts:112`) carries `[key: string]: unknown`. So no helper's parameter
  types reach the checker, and "number expected, got string" can't be reported.

In Rails an ERB template compiles into a method on the view class
(`ActionView::Template#compile`, `actionview/lib/action_view/template.rb`).
Helpers resolve on the view instance: `ActionView::Base` plus the controller's
`helper :all` / `_helpers` module (`actionpack/lib/abstract_controller/helpers.rb`,
`action_controller/metal/helpers.rb`). Locals are `local_assigns`, and ivars are
copied from the controller (`ActionView::Base#assign`). trails' typed view needs
the same scope, as TypeScript declarations.

## Converged shape

A compiled `.tse.ts` declares its scope from the same sources Rails resolves at
render time:

- **ActionView's helper modules**, typed from `@blazetrails/actionview`'s
  exports.
- **The app's helpers:** `app/helpers/*` for `helper :all`, which is Rails'
  default for `ActionController::Base`.
- **The template's locals.** `TemplateRegistry` / `TemplateLocals` already
  exist for `render` (`tse.ts`).
- **The controller's `declare`d ivars as `this`.** The scaffold controller
  already declares `posts: Post[]` / `post: Post`.

The generated `tsconfig` then includes `.trails/views`, and `trails-tsc`
rebuilds the views before checking, so `pnpm build` type-checks every template.

## Acceptance criteria

- [ ] In a fresh scaffolded app, `pnpm build` passes as generated. It fails
      with a `TS2345` pointing at the `.tse` source line after
      `readingTime(post.title)` is added to `_post.html.tse`, with
      `readingTime(words: number)` in `PostsHelper`.
- [ ] Every scaffold view type-checks with no `Cannot find name` errors:
      helpers, `formWith`'s builder, locals and ivars all resolve.
- [ ] Diagnostics map back to `.tse` line and column. The `.map` files
      `trails-tsc-views` already writes carry the positions.
