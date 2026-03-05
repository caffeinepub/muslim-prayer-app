# Пятница!

## Current State
Full Islamic companion app with Prayer Times, Qibla, Tasbih, Quran, Ramadan, and Profile tabs. Profile has Firebase auth (email magic link + author login), achievements, tasbih stats, prayer settings. App uses motion/react animations throughout. Emoji/sticker elements used as static icons in badges and achievement cards.

## Requested Changes (Diff)

### Add
- **Notification permission request block** in Profile page (similar to geolocation UX):
  - Shows a card with "Включить уведомления" button
  - When user clicks, browser `Notification.requestPermission()` is called
  - Permission state saved to localStorage (`notif_permission`)
  - If granted, notification settings expand below (not shown until permission granted)
- **Notification settings panel** (shown only after permission granted):
  - Toggle: уведомления за 10 минут до ифтара
  - Toggle: уведомления за 10 минут до сухура
  - Toggle: напоминания о времени каждого намаза (Фаджр, Зухр, Аср, Магриб, Иша)
  - Each setting saved to localStorage
  - Use browser Notification API + setTimeout scheduling to fire notifications at the right time
- **Mini animations on all emoji stickers/badges** in the profile (badges row, achievement card icons) — subtle float/pulse/bounce effects using motion/react

### Modify
- `ProfileTab.tsx`: add notification section between achievements/stats and prayer settings
- Both `ProfileScreen` and `AuthorProfileScreen` get the notification section
- Badge emoji elements get `motion.span` with looping subtle animation
- Achievement card emoji icons get subtle scale/rotate animation

### Remove
- Nothing removed

## Implementation Plan
1. Add `NotificationSection` component in `ProfileTab.tsx`:
   - Check `Notification.permission` and localStorage on load
   - Show permission request card if not granted
   - Show settings toggles if granted
   - Schedule/reschedule notifications on toggle changes using `setTimeout` based on current prayer times from localStorage
2. Add animated emoji wrappers to badge elements and achievement card icons using `motion.span` with looping keyframe animations (float, bounce, pulse variants)
3. Insert `<NotificationSection />` into both `ProfileScreen` and `AuthorProfileScreen` before prayer settings
4. Validate and build
