import { useState, useEffect } from "react";

export type Lang = "en" | "ar" | "hi" | "bn";

export const LANGUAGES = [
  { code: "en" as Lang, label: "English", flag: "🇺🇸", dir: "ltr" as const },
  { code: "ar" as Lang, label: "العربية", flag: "🇸🇦", dir: "rtl" as const },
  { code: "hi" as Lang, label: "हिन्दी", flag: "🇮🇳", dir: "ltr" as const },
  { code: "bn" as Lang, label: "বাংলা", flag: "🇧🇩", dir: "ltr" as const },
];

const T: Record<Lang, Record<string, string>> = {
  en: {
    welcome: "Welcome to iUnlockd", signInSub: "Sign in to your account",
    email: "Email", emailPh: "Enter your email address",
    password: "Password", passwordPh: "Enter your password",
    forgotPw: "Forgot password?", humanCheck: "Let us know you are human",
    rememberMe: "Remember me", signIn: "Sign In", signingIn: "Signing in…",
    passkeyBtn: "🔑 Sign in with Passkey", verifying: "Verifying…",
    newUser: "New user?", createAccount: "Create an account", support: "Support",
    securityCheck: "Complete the security check.", enterValidEmail: "Enter a valid email.",
    enterPassword: "Enter your password.", networkError: "Network error. Please try again.",
    accountInfo: "Account Information", accountInfoSub: "Enter your account details",
    firstName: "First Name", lastName: "Last Name",
    confirmPw: "Confirm Password", firstNamePh: "First name", lastNamePh: "Last name",
    emailPhReg: "Enter your email", pwPhReg: "Create a strong password",
    confirmPwPh: "Repeat your password", agreeTerms: "I agree to the",
    terms: "Terms", privacy: "Privacy Policy", next: "Next →",
    haveAccount: "Already have an account?", signInLink: "Sign in",
  },
  ar: {
    welcome: "مرحباً بك في iUnlockd", signInSub: "تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني", emailPh: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور", passwordPh: "أدخل كلمة المرور",
    forgotPw: "نسيت كلمة المرور؟", humanCheck: "أثبت أنك لست روبوتاً",
    rememberMe: "تذكرني", signIn: "تسجيل الدخول", signingIn: "جارٍ تسجيل الدخول…",
    passkeyBtn: "🔑 تسجيل بمفتاح المرور", verifying: "جارٍ التحقق…",
    newUser: "مستخدم جديد؟", createAccount: "إنشاء حساب", support: "الدعم",
    securityCheck: "أكمل فحص الأمان.", enterValidEmail: "أدخل بريداً صحيحاً.",
    enterPassword: "أدخل كلمة المرور.", networkError: "خطأ في الشبكة. حاول مرة أخرى.",
    accountInfo: "معلومات الحساب", accountInfoSub: "أدخل تفاصيل حسابك",
    firstName: "الاسم الأول", lastName: "اسم العائلة",
    confirmPw: "تأكيد كلمة المرور", firstNamePh: "الاسم الأول", lastNamePh: "اسم العائلة",
    emailPhReg: "أدخل بريدك الإلكتروني", pwPhReg: "أنشئ كلمة مرور قوية",
    confirmPwPh: "أعد كلمة المرور", agreeTerms: "أوافق على",
    terms: "الشروط", privacy: "سياسة الخصوصية", next: "التالي →",
    haveAccount: "هل لديك حساب؟", signInLink: "تسجيل الدخول",
  },
  hi: {
    welcome: "iUnlockd में आपका स्वागत है", signInSub: "अपने खाते में साइन इन करें",
    email: "ईमेल", emailPh: "अपना ईमेल दर्ज करें",
    password: "पासवर्ड", passwordPh: "पासवर्ड दर्ज करें",
    forgotPw: "पासवर्ड भूल गए?", humanCheck: "बताएं कि आप इंसान हैं",
    rememberMe: "मुझे याद रखें", signIn: "साइन इन करें", signingIn: "साइन इन हो रहा है…",
    passkeyBtn: "🔑 Passkey से साइन इन", verifying: "सत्यापन हो रहा है…",
    newUser: "नए उपयोगकर्ता?", createAccount: "खाता बनाएं", support: "सहायता",
    securityCheck: "सुरक्षा जांच पूरी करें।", enterValidEmail: "वैध ईमेल दर्ज करें।",
    enterPassword: "पासवर्ड दर्ज करें।", networkError: "नेटवर्क त्रुटि। पुनः प्रयास करें।",
    accountInfo: "खाता जानकारी", accountInfoSub: "अपना विवरण दर्ज करें",
    firstName: "पहला नाम", lastName: "अंतिम नाम",
    confirmPw: "पासवर्ड की पुष्टि करें", firstNamePh: "पहला नाम", lastNamePh: "अंतिम नाम",
    emailPhReg: "ईमेल दर्ज करें", pwPhReg: "मजबूत पासवर्ड बनाएं",
    confirmPwPh: "पासवर्ड दोहराएं", agreeTerms: "मैं सहमत हूं",
    terms: "नियम", privacy: "गोपनीयता नीति", next: "अगला →",
    haveAccount: "पहले से खाता है?", signInLink: "साइन इन करें",
  },
  bn: {
    welcome: "iUnlockd-এ আপনাকে স্বাগতম", signInSub: "আপনার অ্যাকাউন্টে সাইন ইন করুন",
    email: "ইমেইল", emailPh: "আপনার ইমেইল লিখুন",
    password: "পাসওয়ার্ড", passwordPh: "পাসওয়ার্ড লিখুন",
    forgotPw: "পাসওয়ার্ড ভুলে গেছেন?", humanCheck: "নিশ্চিত করুন আপনি মানুষ",
    rememberMe: "আমাকে মনে রাখুন", signIn: "সাইন ইন", signingIn: "সাইন ইন হচ্ছে…",
    passkeyBtn: "🔑 Passkey দিয়ে সাইন ইন", verifying: "যাচাই হচ্ছে…",
    newUser: "নতুন ব্যবহারকারী?", createAccount: "অ্যাকাউন্ট তৈরি করুন", support: "সাপোর্ট",
    securityCheck: "সিকিউরিটি চেক সম্পন্ন করুন।", enterValidEmail: "সঠিক ইমেইল দিন।",
    enterPassword: "পাসওয়ার্ড দিন।", networkError: "নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।",
    accountInfo: "অ্যাকাউন্ট তথ্য", accountInfoSub: "আপনার তথ্য লিখুন",
    firstName: "প্রথম নাম", lastName: "শেষ নাম",
    confirmPw: "পাসওয়ার্ড নিশ্চিত করুন", firstNamePh: "প্রথম নাম", lastNamePh: "শেষ নাম",
    emailPhReg: "ইমেইল লিখুন", pwPhReg: "শক্তিশালী পাসওয়ার্ড তৈরি করুন",
    confirmPwPh: "পাসওয়ার্ড আবার লিখুন", agreeTerms: "আমি সম্মত",
    terms: "শর্তাবলী", privacy: "গোপনীয়তা নীতি", next: "পরবর্তী →",
    haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?", signInLink: "সাইন ইন করুন",
  },
};

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("iu_lang") as Lang) || "en");

  useEffect(() => {
    const dir = LANGUAGES.find(l => l.code === lang)?.dir || "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("iu_lang", l);
    setLangState(l);
    const dir = LANGUAGES.find(x => x.code === l)?.dir || "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = l;
  };

  const t = (key: string): string => T[lang]?.[key] ?? T["en"]?.[key] ?? key;
  const currentLang = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return { lang, setLang, t, dir: currentLang.dir, currentLang };
}
