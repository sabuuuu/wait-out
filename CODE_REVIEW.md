# Pausy — Engineering Review (Post-Refactor State)

> Re-reviewed: May 2026 · All 6 phases of the original review have been completed.
> This document reflects the current state of the codebase.

---

## Current State: What's Good

The codebase is in solid shape. Here's what's working well:

**Security**
- ML service authenticates via Supabase JWT — no API secret in the client bundle
- `python-jose` verifies tokens server-side; `user_id` is extracted from the token, not trusted from the client
- Google OAuth uses `exchangeCodeForSession()` — PKCE-correct, no tokens in query params
- ML training endpoint has Pydantic validation on all 17 feature fields with range constraints
- Per-user training rate limiting (1 hour cooldown) enforced server-side with `Retry-After` header
- `model/.env.dev` is gitignored and was never committed

**Data layer**
- TanStack Query is the single source of truth for server data — Zustand holds only UI state (`activeCollectionId`, `alert`)
- All mutations have optimistic updates with proper rollback on error
- Optimistic IDs use `nanoid()` — no more `Math.random()` collisions
- `OutcomePrompt` writes through the React Query mutation — cache stays in sync
- `getSession()` used everywhere instead of `getUser()` — zero unnecessary network calls on mount
- V2 DB columns and `items_outcome_idx` index are in `db/migrations/0001_v2_ml_columns.sql`

**ML pipeline**
- Feature extraction is in one place (`lib/ml-features.ts`) — `ml-train.ts` calls `extractFeatures()`, no duplication
- `ignored_ratio_cat` is computed correctly from history, not hardcoded to 0.5
- "Neutral" outcomes are excluded from training — only `regretted`/`happy` are used as labels
- ML prediction is non-blocking — item saves with V1 score immediately, ML patches in background
- History is pre-filtered to matching `category_slug` before `extractFeatures`
- `save_model` uses `file_options={"upsert": True}` (boolean, not string)

**Performance**
- `staleTime: 2 minutes` on QueryClient — no refetch on every tab switch
- `QueryClient` is stable via `useState(() => new QueryClient(...))` — no hot-reload cache wipes

**Code quality**
- `score_factors` typed as `ScoreFactors | MLTopFactor[] | null` — no `| any`
- `OutcomeType` and `MLTopFactor` exported from `lib/types.ts`
- Error handling is consistent — `showAlert` used everywhere user-facing, `console.error` removed from UI paths
- `DelayPicker` uses palette colors, not unresolved Nativewind semantic tokens
- "Custom" delay removed from picker UI (type union preserved for future use)
- Quiet hours enforced in `scheduleReminder` with overnight window support
- `SourceLinkInput` component is used (not dead code)
- `ManageCollectionsModal` uses typed router push — no `as any`

**Settings**
- Currency picker: 20 currencies in a `pageSheet` modal, saves to profile
- Payday picker: day 1–31 grid, saves to profile; `calculateRemindAt("payday")` uses the saved day
- Edit profile: inline name editing with confirm/cancel
- Forgot password: wired to `resetPasswordForEmail` in both sign-in screen and settings
- Dead rows (Privacy & Security) removed

---

## Remaining Issues

These are real issues that still exist. Ordered by impact.

### 🔴 High — Fixed ✅

**1. `scheduleReminder` was called with `null` for `globalPrefs`**
> ✅ Fixed. `add.tsx` now pulls `prefs` from `useProfile()` and passes it to `scheduleReminder`. Quiet hours are now enforced at item-add time.

**2. Background ML update bypassed React Query cache**
> ✅ Fixed. After the background Supabase write, `queryClient.invalidateQueries({ queryKey: ["items"] })` is called. The item detail screen now shows the ML score without needing a manual refetch.

**3. `useCollections` optimistic update used `Math.random()` for IDs**
> ✅ Fixed. Now uses `nanoid()`.

**4. Dead `userId` parameter in `triggerModelTraining`**
> ✅ Fixed. The parameter was accepted but never used — the user ID is extracted from the JWT server-side. Removed from `lib/ml-train.ts`, `hooks/useML.ts`, and `components/OutcomePrompt.tsx`. Also removed the `console.error` from the training catch block.

---

### 🔴 Still Needs Attention — Fixed ✅

**Quiet hours input now validates and saves correctly**

Previously the fields called `updatePrefs` on every keystroke, persisting partial strings like `"22:"` to the database. `adjustForQuietHours` would then parse `NaN` and silently break.

Fixed in `settings.tsx`:
- Local state (`quietStart`, `quietEnd`) buffers the input — nothing is saved mid-type
- `isValidTime()` validates `HH:MM` format (hours 0–23, minutes 0–59) on blur
- Invalid input turns the field red and shows a `"Use HH:MM format"` hint
- `updatePrefs` is only called when the value is valid
- `keyboardType="numbers-and-punctuation"` and `maxLength={5}` guide the user toward the right format

---

### 🟡 Medium — Fixed ✅

**5. `THEME` export in `lib/theme.ts`**
> ✅ Removed. Only `NAV_THEME` is used. The 50-line dead export is gone.

**6. `minutesInDay` unused variable in `adjustForQuietHours`**
> ✅ Removed from `lib/notifications.ts`.

**7. `scheduleDigest` used `as any` for trigger types**
> ✅ Fixed. Investigated the actual Expo Notifications types — `NativeDailyTriggerInput` and `NativeWeeklyTriggerInput` don't have a `repeats` field because they're always repeating by design. The `repeats: true` field was simply wrong. Removed it and dropped both `as any` casts. Also fixed `requestPermissions` which had an unnecessary `as any` on `requestPermissionsAsync()`.

**8. Dead `userId` parameter in `triggerModelTraining`**
> ✅ Fixed in the High section.

**9. `PARCHMENT` constant in `sign-in.tsx`**
> ✅ Removed.

**10. `useEffect` in `_layout.tsx` missing `router` dependency**
> ✅ Added `router` to the dependency array.

**11. `ignored_ratio_cat` included "neutral" outcomes in the numerator**
> ✅ Fixed in `lib/ml-features.ts`. Now only counts `outcome === "regretted"` in the numerator, and only considers items with `"regretted"` or `"happy"` outcomes in the denominator — consistent with how training labels are assigned.

---

### 🟢 Low — Nice to Have

**12. `randomWisdom` in `index.tsx` changes on every tab remount**

```ts
const randomWisdom = useMemo(() => WISDOM[Math.floor(Math.random() * WISDOM.length)], []);
```
`useMemo` with `[]` deps runs once per mount. Switching tabs unmounts/remounts the component, so the quote changes every time. This is probably fine UX-wise but worth knowing.

**13. Progress bar in item detail is hardcoded to 40%**

```tsx
<View className="h-full bg-primary" style={{ width: isExpired ? '100%' : '40%' }} />
```
The actual elapsed percentage could be computed from `added_at` and `remind_at`. Not critical but it's a visual lie.

**14. `item/[id].tsx` uses semantic tokens (`bg-background`, `text-foreground`, `bg-muted`) while the rest of the app uses hardcoded palette colors**

The item detail screen was not migrated to the `#282B4A`/`#EEEBDA` palette. It will look different from every other screen. Either migrate it or accept the inconsistency.

**15. Instagram link in item detail is never rendered**

```tsx
{item.tiktok_url && (...)}
// instagram_url is never shown
```
The TikTok link renders but `instagram_url` is silently dropped in the sources section.

**16. No loading state shown while `profile` is fetching in `add.tsx`**

`currency` defaults to `"DZD"` while the profile loads. If the user's actual currency is different, the label flickers from "DZD" to their currency on first render. Show a skeleton or disable the form until profile is loaded.

---

## What's Left to Build (Future Work)

These were intentionally deferred — not bugs, just unbuilt features:

| Feature | Notes |
|---|---|
| Photo upload | Needs `expo-image-picker` + Supabase Storage bucket |
| Custom delay | Needs a date picker component |
| Snooze status | UI to set it + reschedule notification |
| Image display | Blocked on photo upload |
| Password reset deep link handler | `pausy://reset-password` route needs to be created |
| Notification action handlers | `FORGOT`/`STILL_WANT`/`SNOOZE` category actions are registered but never handled |

---

## Quick Fix List

In priority order:

1. Pass `prefs` to `scheduleReminder` in `add.tsx` — 5 minutes
2. Invalidate `["items"]` cache after background ML update in `add.tsx` — 5 minutes
3. Remove `userId` parameter from `triggerModelTraining` — 10 minutes
4. Fix `minutesInDay` unused variable in `notifications.ts` — 1 minute
5. Remove `THEME` export from `lib/theme.ts` — 1 minute
6. Remove `PARCHMENT` constant from `sign-in.tsx` — 1 minute
7. Add quiet hours input validation in settings — 20 minutes
8. Fix `ignored_ratio_cat` to exclude neutral from numerator — 5 minutes
9. Render `instagram_url` in item detail sources — 5 minutes
10. Migrate item detail screen to palette colors — 30 minutes
