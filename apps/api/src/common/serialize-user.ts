/** Yoshni tug'ilgan sanadan hisoblaydi. */
export function calcAge(birth: Date | null): number | null {
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Boshqa foydalanuvchining ochiq (public) ko'rinishi — faqat profilda
 * ko'rsatilishi kerak bo'lgan maydonlar. Moliyaviy, joylashuv (aniq
 * koordinata), obuna va ichki holat maydonlari BU YERDA QAYTARILMAYDI.
 */
export function serializeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    gender: user.gender,
    seekingGender: user.seekingGender,
    intent: user.intent,
    bio: user.bio,
    interests: user.interests,
    age: calcAge(user.birthDate ? new Date(user.birthDate) : null),
    city: user.city ?? null,
    isVerified: user.isVerified,
    photos: user.photos,
    prompts: user.prompts,
  };
}
