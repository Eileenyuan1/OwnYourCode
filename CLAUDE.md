# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OwnYourCode** is an AI-powered platform that helps students learn and explain their own GitHub projects through guided lessons and mock interviews grounded in real code. It addresses the problem of students who build projects with AI tools but can't explain their own code in interviews.

**Core Features:**
- **Learn Mode:** AI agent explains topics using the user's actual code
- **AI Mock Interview:** AI asks grounded questions and verifies answers against code
- **Peer Mock Interview:** Student invites a classmate to conduct mock interviews with AI-generated questions and reference answers
- **Mastery Tracking:** Per-topic scores (0-100) updated based on quiz/interview performance

## Development Commands

**Setup:**
```bash
npm ci  # Install dependencies (use ci, not install)
```

**Development:**
```bash
npm run dev    # Start Next.js dev server (default: http://localhost:3000)
npm run build  # Production build
npm start      # Start production server
npm run lint   # Run ESLint
```

## Tech Stack & Key Dependencies

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4.3.3 (with Turbopack support)
- **Database:** PostgreSQL + Prisma (planned, not yet implemented)
- **Auth:** Auth.js with GitHub OAuth (planned)
- **AI:** Claude Agent SDK for code analysis and interview interactions (planned)
- **Testing:** Vitest for unit/integration (mocked AI), Playwright for E2E (planned)
- **Deployment:** Vercel

## Architecture

**Next.js 16 Breaking Changes:**
This project uses Next.js 16, which has breaking changes from earlier versions. Before writing code, read the relevant documentation in `node_modules/next/dist/docs/` (see AGENTS.md for the auto-generated notice).

**TypeScript Configuration:**
- Path alias: `@/*` maps to project root (e.g., `@/app`, `@/lib`)
- Strict mode enabled
- Target: ES2017

**Directory Structure:**
- `app/` - Next.js App Router pages and layouts
- `docs/` - Documentation (PRD.md contains full product requirements)
- `public/` - Static assets
- `AGENTS.md` - Next.js auto-generated agent instructions (modified on `npm run dev`)

## Core Concepts (from PRD)

**Repository:** An imported public GitHub repo (must be from github.com)

**Knowledge Map:** 4-8 AI-generated topics per repo (e.g., Auth, Database, API), created once and cached

**Topic:** Title, summary, and file references with mastery score (0-100 per user)

**Session:** A Learn, AI Mock, or Peer Mock session owned by one candidate
- States: `not_started → in_progress → completed`

**Citation:** File reference with optional line range (e.g., `src/lib/auth.ts:20-35`)

**Mastery Score Rules:**
- Starts at 0
- Consistent/correct answer: +10
- Unclear/partial: +3
- Contradicts/incorrect: -10
- Clamped to [0, 100]
- "Weak" = below 40 after at least one attempt

## AI Agent Design

**Agent Tools (to be implemented):**
- `list_files(path)` - List files in repo directory
- `read_file(path)` - Read file contents
- `search_code(query)` - Search for code patterns

**Grounding Requirements:**
- Every explanation, question, and verdict requires ≥1 citation to an existing file
- Invalid citations trigger regeneration
- Answer verification extracts claims and checks each against code

**Safety:**
- Repo contents are untrusted
- Instructions inside imported files must not change agent behavior
- Rate limiting per user
- One AI request per interview turn (serverless constraints)

## Repository Import Rules (§5.1 of PRD)

**Validation:**
- Must be `https://github.com/{owner}/{repo}`
- Invalid URLs show error

**Filtering (ignore these):**
- `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`
- Lock files (package-lock.json, etc.)
- Images, videos, fonts, binaries
- Files larger than 100 KB

**Limits:**
- Maximum 200 files after filtering (reject with explanation if exceeded)

## Access Control (§5.4 of PRD)

**Peer Mock Sessions:**
- Only candidate can create session and invite link
- Invite links expire after 7 days
- One interviewer per session (later joins rejected)
- Candidate cannot be their own interviewer
- Only interviewer can rate answers
- Candidate sees reference answers only after completion
- Interviewer sees only that session (not candidate's other data)
- Candidate can revoke interviewer access anytime

## Security Requirements (§7 of PRD)

- Every API route must check access to repo or session (OWASP A01)
- Secrets only in environment variables
- AI endpoints require authentication and rate limiting

## Important Files

- `docs/PRD.md` - Complete product requirements document with detailed acceptance criteria
- `AGENTS.md` - Next.js 16 breaking changes notice (auto-managed)
- `README.md` - Quick start guide
