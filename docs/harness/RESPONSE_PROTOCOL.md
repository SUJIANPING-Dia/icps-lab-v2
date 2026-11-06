# Response Protocol

Every project response starts with the agent identity block required by `AGENTS.md`:

```text
【執行 Agent】
總控：Site Manager Agent
實作：<actual agent name(s), or None for planning only>
階段：<Planning / Editing / Build / Commit / Merge / Push / Review>
狀態：<Ready / In Progress / Blocked / Done>
```

State what was verified, what remains, and whether any release occurred. Do not claim an agent ran unless it was actually dispatched. Distinguish local checks from production observations.

For the final report include the workflow classification, participating agents, files changed, deliberately preserved files, commands/checks and results, current `git status --short`, remaining risks, and the next useful action. Link long checklists instead of repeating command logs. Never include environment values, credentials, or a Deploy Hook URL.

If unexpected work or a failed release gate prevents continuation, report the exact relevant output without secrets, explain the boundary, and state whether any files changed.
