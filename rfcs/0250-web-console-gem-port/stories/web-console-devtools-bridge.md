---
title: "Link the error page's frames to Chrome DevTools"
status: draft
updated: 2026-11-19
rfc: "0250-web-console-gem-port"
cluster: beyond-rails
packages: [web-console]
deps: [web-console-railtie-and-app-generator-entry]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's § "Beyond Rails". With the inspector session already open, the error
page can offer a link that opens DevTools paused at (or inspecting) the
raising frame, so server and browser frames are inspected in one tool.

## Acceptance criteria

- [ ] From the error page, one click opens DevTools on the raising frame's scope.
- [ ] Every public name it adds carries `@noRailsEquivalent`.
