export type Locale = 'ar' | 'fr' | 'en';

export interface Translations {
  common: {
    platformName: string;
    tagline: string;
    search: string;
    searchPlaceholder: string;
    filters: string;
    allWilayas: string;
    allLevels: string;
    allSubjects: string;
    viewProfile: string;
    contactTeacher: string;
    contactInstitution: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    loading: string;
    noResults: string;
    verifiedBadge: string;
    trialBadge: string;
    proBadge: string;
    login: string;
    register: string;
    logout: string;
    dashboard: string;
    rightsReserved: string;
    language: string;
    free: string;
  };
  nav: {
    home: string;
    teachers: string;
    academics: string;
    institutions: string;
    pupils: string;
    students: string;
    store: string;
    community: string;
    about: string;
    pricing: string;
    admin: string;
  };
  personas: {
    teacher: string;
    academic: string;
    pupil: string;
    student: string;
    parent: string;
    institution: string;
    assistant: string;
  };
  discovery: {
    featuredTeachers: string;
    browseBySubject: string;
    verifiedEducatorsAlgeria: string;
    searchTitle: string;
    searchSubtitle: string;
    activeTrialNotice: string;
    trialDaysLeft: string;
    resetFilters: string;
    subjectLabel: string;
    levelLabel: string;
    wilayaLabel: string;
    modeLabel: string;
    maxPriceLabel: string;
    ratingLabel: string;
    allModes: string;
    anyRating: string;
    topRated: string;
    inPerson: string;
    online: string;
    hybrid: string;
    follow: string;
    following: string;
    contact: string;
    trusted: string;
    reviews: string;
    newBadge: string;
    priceOnContact: string;
    fullProfile: string;
    authRequiredContact: string;
  };
  product: {
    exploreMore: string;
    freePreview: string;
    by: string;
    inquiries: string;
    contactSeller: string;
    tasteSample: string;
    fullPrice: string;
  };
  visitors: {
    whoViewedMyProfile: string;
    whoViewedMyProduct: string;
    recentVisitors: string;
    totalViews: string;
    uniqueVisitors: string;
    lastViewed: string;
    noVisitorsYet: string;
  };
  admin: {
    controlCenter: string;
    plansAndPricing: string;
    navigationManager: string;
    promotionsSponsors: string;
    taxonomyManager: string;
    mediaPolicies: string;
    verifications: string;
    overview: string;
  };
}

export const dictionaries: Record<Locale, Translations> = {
  ar: {
    common: {
      platformName: "PROF DZ",
      tagline: "المنصة التعليمية الأولى في الجزائر لربط الأساتذة والمدرسين بالطلاب والأولياء",
      search: "بحث",
      searchPlaceholder: "ابحث بالاسم، المادة، الولاية، أو الطور التعليمي...",
      filters: "تصفية النتائج",
      allWilayas: "جميع الولايات (58 ولاية)",
      allLevels: "جميع الأطوار والسنوات",
      allSubjects: "جميع المواد",
      viewProfile: "عرض الملف الشخصي",
      contactTeacher: "تواصل مع الأستاذ",
      contactInstitution: "تواصل مع المؤسسة",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      loading: "جاري التحميل...",
      noResults: "لم يتم العثور على نتائج مطابقة",
      verifiedBadge: "أستاذ معتمد وموثق",
      trialBadge: "فترة تجريبية مجانية (30 يوم)",
      proBadge: "عضوية احترافية PRO",
      login: "تسجيل الدخول",
      register: "إنشاء حساب جديد",
      logout: "تسجيل الخروج",
      dashboard: "لوحة التحكم",
      rightsReserved: "جميع الحقوق محفوظة لمنصة قراتي",
      language: "اللغة",
      free: "مجاني",
    },
    nav: {
      home: "الرئيسية",
      teachers: "الأساتذة",
      academics: "الدكاترة",
      institutions: "المؤسسات",
      pupils: "التلاميذ",
      students: "الطلبة",
      store: "المنتجات",
      community: "المجتمع",
      about: "من نحن",
      pricing: "الخطط والاشتراكات",
      admin: "مركز التحكم الإداري",
    },
    personas: {
      teacher: "أستاذ",
      academic: "أستاذ جامعي / باحث",
      pupil: "تلميذ (ابتدائي / متوسط / ثانوي)",
      student: "طالب جامعي",
      parent: "ولي أمر",
      institution: "مؤسسة تعليمية / معهد",
      assistant: "مساعد تعليمي",
    },
    discovery: {
      featuredTeachers: "نخبة الأساتذة الموصى بهم",
      browseBySubject: "تصفح حسب المادة والتخصص",
      verifiedEducatorsAlgeria: "أساتذة ونخب تعليمية موثقة عبر 58 ولاية",
      searchTitle: "اكتشف أفضل الكفاءات التعليمية في الجزائر",
      searchSubtitle: "تواصل مباشر مع الأساتذة، المؤسسات المعتمدة، والموارد الأكاديمية",
      activeTrialNotice: "أنت الآن في الفترة التجريبية المجانية الكاملة",
      trialDaysLeft: "الأيام المتبقية في التجربة:",
      resetFilters: "إعادة ضبط",
      subjectLabel: "المادة",
      levelLabel: "المستوى",
      wilayaLabel: "الولاية",
      modeLabel: "طريقة التدريس",
      maxPriceLabel: "السعر الأقصى (DZD)",
      ratingLabel: "التقييم",
      allModes: "الكل (حضوري وعن بُعد)",
      anyRating: "الكل (أي تقييم)",
      topRated: "4.8+ نجوم ممتاز",
      inPerson: "حضوري",
      online: "عن بُعد",
      hybrid: "حضوري وعن بُعد",
      follow: "متابعة",
      following: "متابع",
      contact: "تواصل",
      trusted: "موثوق",
      reviews: "تقييم",
      newBadge: "جديد",
      priceOnContact: "السعر عند التواصل",
      fullProfile: "عرض الملف الكامل والمنتجات الرقمية",
      authRequiredContact: "لحماية خصوصية الأساتذة والحد من الاتصالات العشوائية، يتطلب فتح قنوات التواصل المباشر تسجيل الدخول إلى حسابك.",
    },
    product: {
      exploreMore: "استكشف المنتج أكثر",
      freePreview: "معاينة مجانية",
      by: "بواسطة",
      inquiries: "استفسار",
      contactSeller: "تواصل مع البائع",
      tasteSample: "عينة التذوق المجانية",
      fullPrice: "السعر الكامل:",
    },
    visitors: {
      whoViewedMyProfile: "من زار ملفي الشخصي؟",
      whoViewedMyProduct: "من شاهد هذا المورد التعليمي؟",
      recentVisitors: "آخر الزوار المتفاعلين",
      totalViews: "إجمالي المشاهدات",
      uniqueVisitors: "الزوار الفعليون",
      lastViewed: "آخر زيارة",
      noVisitorsYet: "لا توجد زيارات مسجلة حتى الآن بعد إطلاق الرصد الذكي",
    },
    admin: {
      controlCenter: "مركز التحكم الشامل - منصة قراتي",
      plansAndPricing: "إدارة الخطط والأسعار",
      navigationManager: "إدارة القوائم والتنقل",
      promotionsSponsors: "الإعلانات والرعايات",
      taxonomyManager: "إدارة المواد والأطوار",
      mediaPolicies: "سياسات الوسائط والفيديو",
      verifications: "التوثيق والتحقق",
      overview: "نظرة عامة على المنصة",
    },
  },
  fr: {
    common: {
      platformName: "PROF DZ",
      tagline: "La première plateforme éducative en Algérie connectant les enseignants aux étudiants",
      search: "Rechercher",
      searchPlaceholder: "Recherche par nom, matière, wilaya ou niveau...",
      filters: "Filtrer les résultats",
      allWilayas: "Toutes les wilayas (58 wilayas)",
      allLevels: "Tous les cycles et niveaux",
      allSubjects: "Toutes les matières",
      viewProfile: "Voir le profil",
      contactTeacher: "Contacter l'enseignant",
      contactInstitution: "Contacter l'institution",
      save: "Enregistrer les modifications",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      loading: "Chargement en cours...",
      noResults: "Aucun résultat correspondant trouvé",
      verifiedBadge: "Enseignant Vérifié et Certifié",
      trialBadge: "Essai Gratuit (30 Jours)",
      proBadge: "Membre Professionnel PRO",
      login: "Connexion",
      register: "Créer un compte",
      logout: "Déconnexion",
      dashboard: "Tableau de bord",
      rightsReserved: "Tous droits réservés - Plateforme KRYTY",
      language: "Langue",
      free: "Gratuit",
    },
    nav: {
      home: "Accueil",
      teachers: "Enseignants",
      academics: "Universitaires & Chercheurs",
      institutions: "Institutions & Écoles",
      pupils: "Élèves (Primaire/Moyen/Lycée)",
      students: "Étudiants Universitaires",
      store: "Boutique & Ressources",
      community: "Communauté KRYTY",
      about: "À propos",
      pricing: "Abonnements & Tarifs",
      admin: "Centre de Contrôle Admin",
    },
    personas: {
      teacher: "Enseignant",
      academic: "Universitaire / Chercheur",
      pupil: "Élève (Scolaire)",
      student: "Étudiant Universitaire",
      parent: "Parent d'élève",
      institution: "Institution / École",
      assistant: "Assistant Pédagogique",
    },
    discovery: {
      featuredTeachers: "Enseignants d'élite recommandés",
      browseBySubject: "Parcourir par matière et spécialité",
      verifiedEducatorsAlgeria: "Enseignants vérifiés à travers les 58 wilayas",
      searchTitle: "Découvrez l'excellence éducative en Algérie",
      searchSubtitle: "Connexion directe avec les meilleurs enseignants et institutions",
      activeTrialNotice: "Vous bénéficiez actuellement de l'essai gratuit de 30 jours",
      trialDaysLeft: "Jours restants dans votre essai :",
      resetFilters: "Réinitialiser",
      subjectLabel: "Matière",
      levelLabel: "Niveau",
      wilayaLabel: "Wilaya",
      modeLabel: "Mode d'enseignement",
      maxPriceLabel: "Prix max (DZD)",
      ratingLabel: "Évaluation",
      allModes: "Tous les modes",
      anyRating: "Toutes les notes",
      topRated: "4.8+ étoiles (Excellence)",
      inPerson: "En présentiel",
      online: "En ligne",
      hybrid: "Présentiel & En ligne",
      follow: "Suivre",
      following: "Abonné",
      contact: "Contacter",
      trusted: "Certifié",
      reviews: "avis",
      newBadge: "Nouveau",
      priceOnContact: "Prix sur demande",
      fullProfile: "Voir le profil complet et les ressources",
      authRequiredContact: "Pour protéger la vie privée des enseignants, veuillez vous connecter pour accéder aux coordonnées directes.",
    },
    product: {
      exploreMore: "Explorer la ressource",
      freePreview: "Aperçu gratuit",
      by: "Par",
      inquiries: "demande(s)",
      contactSeller: "Contacter le créateur",
      tasteSample: "Échantillon gratuit avant commande",
      fullPrice: "Prix complet :",
    },
    visitors: {
      whoViewedMyProfile: "Qui a visité mon profil ?",
      whoViewedMyProduct: "Qui a consulté cette ressource ?",
      recentVisitors: "Visiteurs récents",
      totalViews: "Vues totales",
      uniqueVisitors: "Visiteurs uniques",
      lastViewed: "Dernière visite",
      noVisitorsYet: "Aucune visite enregistrée pour le moment",
    },
    admin: {
      controlCenter: "Centre de Contrôle Global - KRYTY",
      plansAndPricing: "Gestion des Offres & Tarifs",
      navigationManager: "Gestion de la Navigation",
      promotionsSponsors: "Promotions & Sponsors",
      taxonomyManager: "Matières & Niveaux",
      mediaPolicies: "Politiques Média & Vidéo",
      verifications: "Vérification des Comptes",
      overview: "Aperçu de la Plateforme",
    },
  },
  en: {
    common: {
      platformName: "PROF DZ",
      tagline: "Algeria's premier educational platform connecting teachers with students",
      search: "Search",
      searchPlaceholder: "Search by name, subject, wilaya, or level...",
      filters: "Filter Results",
      allWilayas: "All Wilayas (58 Wilayas)",
      allLevels: "All Levels and Grades",
      allSubjects: "All Subjects",
      viewProfile: "View Profile",
      contactTeacher: "Contact Teacher",
      contactInstitution: "Contact Institution",
      save: "Save Changes",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      loading: "Loading...",
      noResults: "No matching results found",
      verifiedBadge: "Verified Educator",
      trialBadge: "Free Trial (30 Days)",
      proBadge: "PRO Member",
      login: "Log In",
      register: "Sign Up",
      logout: "Log Out",
      dashboard: "Dashboard",
      rightsReserved: "All rights reserved - KRYTY Platform",
      language: "Language",
      free: "Free",
    },
    nav: {
      home: "Home",
      teachers: "Teachers Directory",
      academics: "Academics & Scholars",
      institutions: "Institutions & Schools",
      pupils: "Pupils (K-12)",
      students: "University Students",
      store: "Store & Resources",
      community: "KRYTY Community",
      about: "About KRYTY",
      pricing: "Plans & Pricing",
      admin: "Admin Control Center",
    },
    personas: {
      teacher: "Teacher",
      academic: "Academic / Researcher",
      pupil: "School Pupil",
      student: "University Student",
      parent: "Parent",
      institution: "Educational Institution",
      assistant: "Teaching Assistant",
    },
    discovery: {
      featuredTeachers: "Featured & Recommended Teachers",
      browseBySubject: "Browse by Subject & Specialty",
      verifiedEducatorsAlgeria: "Verified educators across 58 Algerian wilayas",
      searchTitle: "Discover Educational Excellence in Algeria",
      searchSubtitle: "Direct connection with top teachers, certified institutions, and academic resources",
      activeTrialNotice: "You are currently enjoying your 30-day full access free trial",
      trialDaysLeft: "Days left in your trial:",
      resetFilters: "Reset Filters",
      subjectLabel: "Subject",
      levelLabel: "Level",
      wilayaLabel: "Wilaya",
      modeLabel: "Teaching Mode",
      maxPriceLabel: "Max Price (DZD)",
      ratingLabel: "Rating",
      allModes: "All Modes (In-Person & Online)",
      anyRating: "Any Rating",
      topRated: "4.8+ Stars (Top Rated)",
      inPerson: "In-Person",
      online: "Online",
      hybrid: "Hybrid (In-Person & Online)",
      follow: "Follow",
      following: "Following",
      contact: "Contact",
      trusted: "Verified",
      reviews: "reviews",
      newBadge: "New",
      priceOnContact: "Price on contact",
      fullProfile: "View Full Profile & Resources",
      authRequiredContact: "To protect educator privacy and prevent spam, please log in to access direct contact details.",
    },
    product: {
      exploreMore: "Explore Product",
      freePreview: "Free Preview",
      by: "By",
      inquiries: "inquiries",
      contactSeller: "Contact Creator",
      tasteSample: "Free Sample Preview",
      fullPrice: "Full Price:",
    },
    visitors: {
      whoViewedMyProfile: "Who Viewed My Profile?",
      whoViewedMyProduct: "Who Viewed This Resource?",
      recentVisitors: "Recent Visitors",
      totalViews: "Total Views",
      uniqueVisitors: "Unique Visitors",
      lastViewed: "Last Visit",
      noVisitorsYet: "No visits recorded yet",
    },
    admin: {
      controlCenter: "Admin Control Center - KRYTY",
      plansAndPricing: "Plans & Pricing Manager",
      navigationManager: "Navigation Manager",
      promotionsSponsors: "Promotions & Sponsors",
      taxonomyManager: "Taxonomy & Levels",
      mediaPolicies: "Media & Video Policies",
      verifications: "Verification Requests",
      overview: "Platform Overview",
    },
  },
};
