# AGENTS.md — Sokoban Web Full-Chain Workflow

This repo follows a full-chain engineering workflow: **Develop → Test → PR Preview → Merge → Auto Deploy**.

## Execution Standard

- Default implementation mode: **Codex CLI** for feature work.
- Direct in-session edits are allowed for emergency hotfixes/small tweaks.
- All changes must pass local checks before push.

## Branch Strategy

- `main`: production branch (deploy target)
- `feat/*`: new features
- `fix/*`: bug fixes
- `chore/*`: maintenance

Never push risky/incomplete changes directly to `main`.

## Definition of Done (DoD)

Before opening PR or merging:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. Manual smoke test (movement, push box, win state, reset, undo)

## Deployment Rules

- Vercel auto-deploys from GitHub.
- PRs should use Preview deployments for acceptance.
- `main` deploys to Production.

## Commit Convention

Use conventional commits:

- `feat:` new features
- `fix:` bug fixes
- `chore:` maintenance
- `docs:` documentation
- `refactor:` code restructure without behavior change

## Safety

- Never commit secrets.
- Store env vars in Vercel/GitHub secrets only.
- Prefer small, reviewable PRs.
