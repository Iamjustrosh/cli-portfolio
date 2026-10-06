/** Whole years between a YYYY-MM-DD birth date and `today`. */
export function ageFromBirthDate(dateOfBirth: string, today: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
