/**
 * Converts a Gregorian date to Hijri (Islamic) date.
 * Uses a simple algorithmic approach.
 */
export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

const HIJRI_MONTHS = [
  "Мухаррам",
  "Сафар",
  "Раби аль-Авваль",
  "Раби ас-Сани",
  "Джумада аль-Уля",
  "Джумада ас-Сания",
  "Раджаб",
  "Шабан",
  "Рамадан",
  "Шавваль",
  "Зуль-Каада",
  "Зуль-Хиджа",
];

export function toHijri(date: Date): HijriDate {
  // Algorithm based on the Kuwaiti algorithm
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5;

  const Z = Math.floor(JD + 0.5);
  const F = JD + 0.5 - Z;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = F;

  const L = Z - 1948440 + 10632;
  const N = Math.floor((L - 1) / 10631);
  const L2 = L - 10631 * N + 354;
  const J =
    Math.floor((10985 - L2) / 5316) * Math.floor((50 * L2) / 17719) +
    Math.floor(L2 / 5670) * Math.floor((43 * L2) / 15238);
  const L3 =
    L2 -
    Math.floor((30 - J) / 15) * Math.floor((17719 * J) / 50) -
    Math.floor(J / 16) * Math.floor((15238 * J) / 43) +
    29;
  const hMonth = Math.floor((24 * L3) / 709);
  const hDay = L3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * N + J - 30;

  return {
    day: hDay,
    month: hMonth,
    year: hYear,
    monthName: HIJRI_MONTHS[hMonth - 1] || "",
  };
}

export const GREGORIAN_MONTHS_RU = [
  "Января",
  "Февраля",
  "Марта",
  "Апреля",
  "Мая",
  "Июня",
  "Июля",
  "Августа",
  "Сентября",
  "Октября",
  "Ноября",
  "Декабря",
];

export const WEEKDAYS_RU = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export function formatGregorianRu(date: Date): string {
  return `${WEEKDAYS_RU[date.getDay()]}, ${date.getDate()} ${GREGORIAN_MONTHS_RU[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatHijriRu(h: HijriDate): string {
  return `${h.day} ${h.monthName} ${h.year} г.х.`;
}
