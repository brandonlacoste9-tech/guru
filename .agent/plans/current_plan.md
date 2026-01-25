# Project Plan – Guru Platform (Week 1‑2)

## Completed Foundations

- Added `.env` with `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Fixed `schema.ts` imports (`real`, `decimal`) and removed undefined `automationLogs` references.
- Ran Drizzle migrations – 16 tables now exist in Supabase.
- Implemented `python_guru_service.py` for async‑pg CRUD.
- Integrated Python service into `GuruOrchestrator` (load guru, load automations, log execution, increment stats).
- Added `SchedulerService` (cron‑based execution of scheduled automations) and started it in `src/index.ts`.
- Created a full MCP wrapper (`supabaseMcpAll`) exposing all ~40 Supabase MCP endpoints.
- Updated API routes (`guruRoutes`, `marketplaceRoutes`, `automationRoutes`).

## Next Milestones

1. **Seed Initial Data** – create sample gurus, templates, and automations (via script or Supabase UI).
2. **UI Development** – _[In Progress]_
   - ✅ Dashboard & Navigation
   - ✅ Guru Builder (Create Page)
   - ✅ Teaching UI (Browser Automation Recording)
   - ⬜ Marketplace Detail Views
3. **Notification Service** – email/push notifications after each automation run.
4. **CI/CD Pipeline** – GitHub Actions workflow to run migrations and build/deploy the API.
5. **Testing** – add unit & integration tests for the Python service, scheduler, and API endpoints.

## Future Enhancements (Backlog)

- **Error Boundaries**: Robust error handling for Teaching UI.
- **Analytics**: Track recording duration, steps, and error rates.
- **Accessibility**: ARIA labels and keyboard navigation.
- **Automation Sharing**: Cross-guru sharing and version control.

## Quick Reference Commands

```bash
# Install scheduler dependency
pnpm add cron -w

# Run migrations (if needed)
pnpm --filter @guru/database run db:push

# Start API (dev)
pnpm --filter @guru/api dev
```

_All steps are version‑controlled and ready for the next sprint._
