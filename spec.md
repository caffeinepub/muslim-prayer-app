# Muslim Prayer App (Салях)

## Current State

Полнофункциональное приложение для мусульман с пятью вкладками:
- PrayerTimes — времена намаза с геолокацией и обратным отсчётом
- QiblaCompass — компас направления Киблы
- RamadanTab — время сухура/ифтара в Рамадан
- TasbihTab — счётчик зикра
- QuranTab — 114 сур Корана

**Система авторизации:**
- Используется Internet Identity (ICP) через `useInternetIdentity` хук
- В шапке: кнопка "Войти" / статус "Войдено" + кнопка выхода
- Нет отдельной вкладки профиля
- Нет нижней навигации для профиля
- Данные (тасбих, настройки намаза) синхронизируются с ICP бэкендом

**Пользователь хочет:** доработать систему профиля и входа с интеграцией Supabase базы данных.
- URL: https://ydfkfnvfcspxmjscpfrv.supabase.co
- Ключ: sb_publishable_QOIxWQhzEOclCUtWgaHI1A_cK6t6EPK

## Requested Changes (Diff)

### Add
- Установить пакет `@supabase/supabase-js`
- Создать `src/lib/supabase.ts` — Supabase клиент (URL + anon key)
- Создать `src/hooks/useSupabaseAuth.ts` — хук для управления Supabase сессией (signInWithOtp email/magic link, signOut, getSession, onAuthStateChange)
- Создать `src/components/ProfileTab.tsx` — полноценная вкладка профиля:
  - Если не авторизован: форма входа по email (magic link через Supabase) + опция войти через Internet Identity
  - Если авторизован: аватар (инициалы), имя пользователя (редактируемое), email, дата регистрации, кнопка выхода
  - Статистика: количество зикров сегодня, сохранённые настройки намаза
  - Секция "Мои данные" — отображение метода расчёта, мазхаба, местоположения
- Добавить вкладку "Профиль" в нижнюю навигацию (иконка User)
- Таблица в Supabase `user_profiles`: id (uuid), user_id (text), name (text), email (text), created_at, prayer_method (text), madhab (text), location_name (text)

### Modify
- `App.tsx`:
  - Добавить вкладку "Профиль" в массив TABS (6-я кнопка в навигации, или заменить текущую шапку)
  - Вместо текущего блока "Войдено" в шапке — аватар пользователя (кликабельный, ведёт на вкладку профиля)
  - Убрать кнопку LogOut из шапки (перенести в ProfileTab)
  - Интегрировать InternetIdentityProvider + Supabase провайдер
- Шапка: показывать аватар/имя если авторизован через Supabase или ICP, иначе иконку User без имени

### Remove
- Кнопку LogOut из шапки (перенести в ProfileTab)
- Отдельное отображение "Войдено" как текстового лейбла в шапке

## Implementation Plan

1. Установить `@supabase/supabase-js` через npm в `src/frontend`
2. Создать `src/lib/supabase.ts` с инициализацией клиента
3. Создать `src/hooks/useSupabaseAuth.ts` с хуком (signIn по email OTP, signOut, user state)
4. Создать `src/components/ProfileTab.tsx`:
   - Состояние не авторизован: две опции входа (email magic link + Internet Identity)
   - Состояние авторизован: аватар с инициалами, имя/email, редактирование имени, статистика, настройки, кнопка выхода
   - Сохранение профиля в Supabase таблицу `user_profiles` через upsert
5. Обновить `App.tsx`:
   - Добавить вкладку профиля в TABS
   - Шапка: аватар-кнопка вместо текстового "Войдено", клик — переход на вкладку профиля
   - Навигация: 6 вкладок (prayer, qibla, ramadan, tasbih, quran, profile)
