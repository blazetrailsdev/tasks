---
title: "Converge ConfigurationFile#render and parse's ERB branch"
status: done
updated: 2026-08-16
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6613
claim: "2026-08-16T21:13:33Z"
assignee: "djar-eager-chain-ids-drop-disable-joins-arms"
blocked-by: null
closed-reason: null
---

## Context

PR #6608 ported `ConfigurationFile#read` but registered `#render`
(`activesupport/lib/active_support/configuration_file.rb:54-58`) as a
`SCOPED_SKIP_GROUPS` entry in `scripts/parity/conventions.ts`, and baselined the
resulting `parse` / `include?` call-mismatch row in
`scripts/api-compare/call-mismatches-exclude/activesupport/configuration-file.json`.

Rails:

```ruby
def parse(context: nil, **options)
  source = @content.include?("<%") ? render(context) : @content
  ...
end

def render(context)
  require "erb" unless defined?(ERB)
  erb = ERB.new(@content).tap { |e| e.filename = @content_path }
  context ? erb.result(context) : erb.result
end
```

The skip's stated blocker: `render` evaluates the file's ERB at runtime, and
trails' ERB analogue is the TSE handler in
`packages/actionview/src/template/handlers/tse.ts` — a compile-time construct
that trails-tsc builds ahead of time — while activesupport sits below actionview
in the package graph. So `parse` (`configuration-file.ts`) has no render branch
and always parses the file as written; a `database.yml`-style config with `<% %>`
interpolation silently parses as literal text rather than being evaluated.

This is the deviation to converge, not to ratify: it is a real behavioural gap
for every caller that reads a config file with ERB in it, which is the normal
Rails shape for `database.yml` / `storage.yml` / `cable.yml`.

## Converged shape

Port `render(context)` at its Rails name in `configuration-file.ts` and restore
`parse`'s `@content.include?("<%")` branch, then delete both the
`SCOPED_SKIP_GROUPS` entry for `render` (regenerating
`docs/ruby-ts-conventions.md` with `pnpm parity:api:conventions`) and the
baselined `parse` / `include?` row.

The open design question the story has to answer first is what plays ERB's part
without activesupport depending on actionview — most likely a runtime template
evaluator that activesupport can own, or an injected renderer seam the
actionview/railties layer fills in. Whatever the answer, `render` keeps its
Rails name and `parse` keeps Rails' two-branch control flow.

## Acceptance criteria

- [ ] `ConfigurationFile#render` exists at its Rails name and `parse` takes the
      `include?("<%")` branch, matching configuration_file.rb:21-41,54-58.
- [ ] The `render` `SCOPED_SKIP_GROUPS` entry is deleted and
      `docs/ruby-ts-conventions.md` regenerated.
- [ ] The `parse` / `include?` row is deleted from
      `call-mismatches-exclude/activesupport/configuration-file.json` and the
      mark shard tightened.
- [ ] A test covers a config file whose ERB is evaluated before the YAML parse.
- [ ] No `node:*` import and no new third-party runtime dep is introduced.
