# AI Maid Hunter

A standalone, local-only recruitment-assistance prototype. It uses fictional public-search posts to demonstrate human-reviewed lead qualification, permission-based outreach, AI-assisted screening, and a temporary test application.

The prototype does **not** scrape Facebook, access private groups, automate personal accounts, contact real people, or collect identity documents.

## Quick start

Requires Node.js 20+.

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:5173`.

- Admin: `admin@gmail.com` / `admin123`
- Recruiter: `recruiter@maidhunter.local` / `Recruiter123!`

These passwords are for local testing only. Change `SESSION_SECRET` and all passwords before any non-local use.

## Commands

```bash
npm run dev          # Vite and Express together
npm run db:migrate   # apply SQLite migrations
npm run db:seed      # reset and load fictional demo records
npm test             # Vitest suite
npm run typecheck
npm run build
npm start            # API only
```

## Structure

```text
prisma/
  schema.prisma       SQLite data model
  migrations/         reproducible database migration
  seed.ts             admin, recruiter, 10 leads, screenings, applications, logs
server/
  app.ts              Express REST API, auth, authorization, validation
  providers.ts        mock and future provider adapters
  workflow.ts         enforced status transitions and screening questions
src/
  App.tsx             recruiter/admin and candidate routes
  api.ts              cookie-authenticated API client
  styles.css          responsive accessible visual system
```

## Implemented workflows

- HTTP-only server sessions, bcrypt password hashing, role checks, Helmet, CORS, rate limiting, Zod validation, and centralized errors
- Tavily public-web search, including a query for publicly indexed Facebook URLs; mock search remains available for offline development
- Live GroqCloud analysis when `AI_PROVIDER=groq` and `GROQ_API_KEY` are configured; deterministic mock fallback otherwise
- Deterministic applicant-versus-employer/agency classification; only explicit job seekers become leads
- Duplicate warning, recruiter approval/rejection/duplicate actions, assignment model, notes, archive, and audit timeline
- Server-enforced lead state machine and immediate do-not-contact enforcement
- Editable, human-approved outreach drafts and YES/NO/STOP/no-response simulation
- Consent-gated candidate chat, one question at a time, human-recruiter pause, and summary
- Consent-gated temporary application with prominent sensitive-data warning
- Dashboard, responsive lead table, search runs, applications, audit logs, users, settings, empty/error/loading states

Messaging and candidate replies remain simulated. With Tavily enabled, search results can refer to real public web pages and are transmitted to Groq for classification, so review provider terms, retention, privacy, and applicable recruitment law before non-test use.

## Safety and limitations

A public post is not recruitment consent. Search results always require recruiter review, outreach requires separate message approval, and screening is unlocked only after a simulated YES. NO and no-response stop the workflow; STOP permanently blocks all outreach on the server.

Never enter passports, national IDs, medical data, financial information, exact addresses, private-group content, or real contact information. Prototype translations require professional review before production. The analyzer may not infer intent or suitability from names, images, gender, nationality, ethnicity, religion, or other protected characteristics.

## Future integrations

The interfaces in `server/providers.ts` are inactive placeholders:

- `ApprovedSearchProvider` needs a lawful, approved public-search API, its terms review, retention rules, and provenance handling.
- `OpenAIAnalyzerProvider` needs a server-side API key, structured-output implementation, Zod validation, monitoring, and human review. No key is exposed to the browser.
- `FacebookMessengerProvider` cannot search arbitrary Facebook personal posts or private groups. It must use official Meta APIs, message through an official Facebook Page, and requires suitable permissions, Meta review, consent handling, and messaging-policy compliance.
- `WhatsAppBusinessProvider` requires an approved WhatsApp Business account, templates, consent, and policy compliance.
- `ExistingWebsiteRegistrationProvider` requires an authenticated server-to-server contract, token exchange, data mapping, consent/retention review, and audit events.

This code is a testing prototype, not a production recruitment system.
