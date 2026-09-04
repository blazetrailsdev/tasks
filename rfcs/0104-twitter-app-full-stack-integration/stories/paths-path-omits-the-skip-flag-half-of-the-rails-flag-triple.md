---
title: "Paths::Path ports only x!/x? per flag — all four skip_x! methods are missing"
status: done
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: 7497
claim: "2026-09-04T20:50:46Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while adding the autoload / autoload_once flags to `Paths::Path` in
PR #7298 (RFC 0069, `engine-all-autoload-paths-union-paths-registry`).

Rails metaprograms **three** methods per flag
(`vendor/rails/railties/lib/rails/paths.rb:151-165`):

```ruby
%w(autoload_once eager_load autoload load_path).each do |m|
  class_eval <<-RUBY, __FILE__, __LINE__ + 1
    def #{m}!        # def eager_load!
      @#{m} = true   #   @eager_load = true
    end              # end

    def skip_#{m}!   # def skip_eager_load!
      @#{m} = false  #   @eager_load = false
    end              # end

    def #{m}?        # def eager_load?
      @#{m}          #   @eager_load
    end              # end
  RUBY
end
```

trails' `packages/trailties/src/paths.ts` `Path` ports only two of the three
for every flag — `autoloadOnceBang` / `isAutoloadOnce`, `eagerLoadBang` /
`isEagerLoad`, `autoloadBang` / `isAutoload`, `loadPathBang` / `isLoadPath`.
**All four `skip_*!` methods are missing.**

The gap predates the autoload flags (it was already true of `eager_load` and
`load_path`); PR #7298 matched the existing two-method shape rather than
widening it, which is why this is filed rather than fixed there.

The omission also costs the constructor its Rails shape. Rails writes each
flag through the pair (`paths.rb:126-129`):

```ruby
options[:autoload_once] ? autoload_once! : skip_autoload_once!
options[:eager_load]    ? eager_load!    : skip_eager_load!
options[:autoload]      ? autoload!      : skip_autoload!
options[:load_path]     ? load_path!     : skip_load_path!
```

where trails assigns the private fields directly with `!!options.x`.

## Converged shape

- Add `skipAutoloadOnceBang()`, `skipEagerLoadBang()`, `skipAutoloadBang()`,
  `skipLoadPathBang()` to `Path`, each setting its field to `false`, in the
  `paths.rb:151` order the class already follows.
- Rewrite the constructor's four flag assignments as the ternary pairs above,
  so the field writes go through the Rails methods.

## Acceptance criteria

- [ ] All four `skip_*!` methods exist on `Path` under the conventions-derived
      TS names, beside their `*Bang` / `is*` siblings.
- [ ] `Path`'s constructor writes every flag through the `x!` / `skipX!` pair,
      mirroring `paths.rb:126-129`, rather than assigning `!!options.x`.
- [ ] `paths.test.ts` covers a `skip_*!` call flipping a flag set at construction.
