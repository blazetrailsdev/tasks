---
title: "Converge Configuration#root to Rails' memoizing find_root"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 45
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Application#initialize` (`packages/trailties/src/application.ts`) pins
`config.root` before running the initializer chain:

```ts
const bootRoot = await this.resolvedRoot();
if (this.config.root === null) this.config.setRoot(bootRoot);
```

It has to, because `add_routing_paths` / `add_view_paths` /
`setup_main_autoloader` read `paths[...]`, and `Path#expanded`
(`packages/trailties/src/paths.ts:128`) throws "You need to set a path root"
when `Root#path` is null.

Rails never needs the pin because `Rails::Application::Configuration#root` is
a memoizing reader
(`vendor/rails/railties/lib/rails/application/configuration.rb`):

```ruby
def root
  @root ||= find_root(root_or_nil)
end
```

so it is never nil once anything asks for it. trails' `Configuration#root` is
a plain field with a separate `setRoot`, and `Engine#root()` /
`Application#resolvedRoot()` are async (the fs seam is async-only), which is
why the resolution was hoisted into `initialize` instead.

## Converged shape

- `Configuration#root` resolves lazily the way Rails does, or — if the async
  fs seam genuinely forbids a lazy getter — `Engine#paths()` resolves the root
  itself for every caller so no caller has to pre-pin it.
- The `if (this.config.root === null) this.config.setRoot(bootRoot)` line and
  its JSDoc paragraph are deleted from `Application#initialize`.
- `Application#resolvedRoot` (a trails addition with no Rails counterpart —
  Rails' `config.root` reader has no cwd tail) is re-examined in the same
  pass.
