---
title: "ruby-compat-open3-popen3-streams-lines"
status: done
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10144
claim: "2026-11-15T19:23:19Z"
assignee: "dev-server-proxy-streaming-default-in-constructor"
blocked-by: null
closed-reason: null
---

## Context

`ViteRuby::IO.capture` (`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/io.rb:10-21`) streams the child's stdout line by line through `Open3.popen3` (`vendor/ruby/v3.3.11/lib/open3.rb:218-235`). ruby-compat has only `Open3.capture3` (`packages/ruby-compat/lib/open3.ts`), so `packages/vite-assets/lib/io.ts` runs `capture3` and yields the lines once the child exits. It carries `@missingRailsCall popen3`.

## Acceptance criteria

- ruby-compat ports `Open3.popen3` with a block (stdin, stdout and stderr as IOs, plus the wait thread), with a `ChildProcessAdapter` arm that streams stdout.
- `IO.capture`'s `with_output` arm calls `popen3` and `read_lines` as `io.rb` does, so each line is yielded while the build is still running. The receipt is removed.
