---
title: "engine-config-constructed-with-found-root"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails constructs `Engine::Configuration` with the root already resolved:
`def config; @config ||= Engine::Configuration.new(self.class.find_root(self.class.called_from)); end`
(`vendor/rails/railties/lib/rails/engine.rb:553`). So `paths` and `root` are both plain
`delegate ... to: :config` (`engine.rb:437`).

trails builds `new EngineConfiguration(null)` in `Engine#config`
(`packages/trailties/src/engine.ts`, `get config()`) and resolves the root lazily in the async
`Engine#root()`, which memoizes into `config.root`. So `Engine#paths()` has to
`await this.root()` before `this.config.paths()`. trails#8084 removed the old
`cfg.root === null` guard but had to keep that bridge: an engine with `calledFrom` set that never
calls `root()` first (`engine.test.ts` "helpersPaths returns only existing app/helpers
directories") otherwise throws "You need to set a path root".

`Engine.findRootWithFlag` / `findRoot` / `Application.findRoot` are declared `async`, but every
call in their bodies is synchronous (`File.isDirectory`, `File.isExist`, `File.realpath`,
`fs.cwd()`).

## Acceptance criteria

- `findRootWithFlag` / `findRoot` (Engine and Application) are synchronous.
- `Engine#config` / `Application#config` construct the configuration with
  `findRoot(calledFrom)`, as `engine.rb:553` does. Where trails sets `calledFrom` after
  registration, that ordering is converged too, not guarded.
- `Engine#paths()` is `return this.config.paths()` and `Engine#root()` is the plain delegation.
