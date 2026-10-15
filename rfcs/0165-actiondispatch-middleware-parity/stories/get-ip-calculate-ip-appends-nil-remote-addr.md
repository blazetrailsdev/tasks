---
title: "GetIp#calculate_ip appends remote_addr unconditionally"
status: in-progress
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8939
claim: "2026-10-15T15:34:30Z"
assignee: "debug-locks-reads-dependencies-interlock"
blocked-by: null
closed-reason: null
---

## Context

`GetIp#calculate_ip` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/remote_ip.rb:166`)
is `filter_proxies(ips + [remote_addr]).first || ips.last || remote_addr`, and
it always appends `remote_addr`, even when it is nil. `filter_proxies` (`:191-195`)
rejects with `proxy === ip`, which is false for nil against both `IPAddr` and
`Regexp`.

`packages/actionpack/src/action-dispatch/middleware/remote-ip.ts` `calculateIp`
appends only when it is set: `remoteAddr ? [...ips, remoteAddr] : ips`. The
guard exists because `proxyMatches(proxy, ip)` hands a regex proxy `ip` through
`RegExp.test`, which turns `undefined` into the string `"undefined"`.

## Acceptance criteria

- `calculateIp` passes `[...ips, remoteAddr]` unconditionally, as `:166` does.
- `proxyMatches` answers false for a nil ip, as Ruby's `Regexp#===` /
  `IPAddr#===` do for nil, so the guard can go.
