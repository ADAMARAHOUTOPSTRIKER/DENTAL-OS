"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "fr" | "ar";
export type Role = "dentist" | "secretary" | "patient";

type Dict = Record<string, { fr: string; ar: string }>;

// Translation dictionary — French primary, Arabic for the full chrome.
export const DICT: Dict = {
  "brand.name": { fr: "Dental Clinic OS", ar: "نظام العيادة" },
  "nav.product": { fr: "Produit", ar: "المنتج" },
  "nav.features": { fr: "Fonctionnalités", ar: "المميزات" },
  "nav.workflow": { fr: "Parcours", ar: "المسار" },
  "nav.pricing": { fr: "Tarifs", ar: "الأسعار" },
  "nav.demo": { fr: "Voir la démo", ar: "شاهد العرض" },
  "nav.launch": { fr: "Ouvrir l’app", ar: "افتح التطبيق" },

  "hero.badge": {
    fr: "Conçu pour les cabinets dentaires marocains",
    ar: "مصمم لعيادات الأسنان المغربية",
  },
  "hero.title1": { fr: "Le système", ar: "النظام" },
  "hero.titleaccent": { fr: "d’exploitation", ar: "التشغيلي" },
  "hero.title2": { fr: "de votre cabinet dentaire", ar: "لعيادة أسنانك" },
  "hero.subtitle": {
    fr: "Du premier rendez-vous à la fidélité à vie. Agenda, plans de traitement, imagerie, facturation et relation patient — réunis dans une plateforme d’une simplicité désarmante.",
    ar: "من الموعد الأول إلى الوفاء مدى الحياة. المواعيد وخطط العلاج والتصوير والفوترة وعلاقة المريض — في منصة واحدة بسيطة بشكل مذهل.",
  },
  "hero.cta": { fr: "Essayer la démo interactive", ar: "جرّب العرض التفاعلي" },
  "hero.cta2": { fr: "Découvrir les fonctions", ar: "اكتشف المميزات" },
  "hero.stat1": { fr: "dentistes au Maroc", ar: "طبيب أسنان في المغرب" },
  "hero.stat2": { fr: "de rendez-vous en moins manqués", ar: "مواعيد ضائعة أقل" },
  "hero.stat3": { fr: "en français & arabe", ar: "بالفرنسية والعربية" },
  "hero.scroll": { fr: "Défiler", ar: "مرّر" },

  "marquee.label": {
    fr: "Tout ce qu’un cabinet moderne attend",
    ar: "كل ما تحتاجه عيادة عصرية",
  },

  "features.kicker": { fr: "Une seule plateforme", ar: "منصة واحدة" },
  "features.title": {
    fr: "Tout le cabinet, parfaitement orchestré",
    ar: "العيادة بأكملها، بتناغم تام",
  },
  "features.subtitle": {
    fr: "Remplacez le carnet papier, WhatsApp et les fichiers dispersés par un système clair, pensé pour la façon dont les cabinets marocains travaillent vraiment.",
    ar: "استبدل الدفتر الورقي وواتساب والملفات المبعثرة بنظام واضح مصمم لطريقة عمل العيادات المغربية فعليًا.",
  },

  "f.booking.t": { fr: "Agenda & rappels", ar: "المواعيد والتذكيرات" },
  "f.booking.d": {
    fr: "Rendez-vous en ligne et rappels WhatsApp automatiques qui font revenir les patients.",
    ar: "مواعيد عبر الإنترنت وتذكيرات واتساب تلقائية تعيد المرضى.",
  },
  "f.plans.t": { fr: "Plans de traitement & devis", ar: "خطط العلاج والفواتير" },
  "f.plans.d": {
    fr: "Créez des devis clairs, suivez l’acceptation et transformez les plans en revenus.",
    ar: "أنشئ فواتير واضحة، وتابع القبول، وحوّل الخطط إلى دخل.",
  },
  "f.imaging.t": { fr: "Coffre d’imagerie", ar: "خزنة التصوير" },
  "f.imaging.d": {
    fr: "Radios, photos avant/après et documents, sécurisés et instantanément retrouvables.",
    ar: "الأشعة وصور قبل/بعد والوثائق، آمنة وسهلة الاسترجاع.",
  },
  "f.billing.t": { fr: "Paiements & échéances", ar: "المدفوعات والأقساط" },
  "f.billing.d": {
    fr: "Suivez espèces, chèques et paiements échelonnés sans un seul carnet.",
    ar: "تابع النقد والشيكات والأقساط دون أي دفتر.",
  },
  "f.family.t": { fr: "Comptes famille", ar: "حسابات العائلة" },
  "f.family.d": {
    fr: "Regroupez parents et enfants sous un même dossier, avec alertes médicales.",
    ar: "اجمع الآباء والأطفال في ملف واحد مع تنبيهات طبية.",
  },
  "f.loyalty.t": { fr: "Rappels & rétention", ar: "التذكير والاحتفاظ" },
  "f.loyalty.d": {
    fr: "Protocoles de rappel cliniques (détartrage, ortho, implants) qui fidélisent.",
    ar: "بروتوكولات تذكير سريرية تعزّز الوفاء.",
  },

  "workflow.kicker": { fr: "Le parcours", ar: "المسار" },
  "workflow.title": {
    fr: "Un patient, du premier appel à la fidélité",
    ar: "مريض واحد، من أول اتصال إلى الوفاء",
  },
  "wf.1.t": { fr: "Réservation", ar: "الحجز" },
  "wf.1.d": {
    fr: "Le patient réserve en ligne ; le cabinet confirme en un geste.",
    ar: "يحجز المريض عبر الإنترنت، وتؤكّد العيادة بلمسة.",
  },
  "wf.2.t": { fr: "Consultation", ar: "الاستشارة" },
  "wf.2.d": {
    fr: "Dossier, alertes médicales et plan de traitement au même endroit.",
    ar: "الملف والتنبيهات وخطة العلاج في مكان واحد.",
  },
  "wf.3.t": { fr: "Devis & soins", ar: "الفاتورة والعلاج" },
  "wf.3.d": {
    fr: "Devis accepté, imagerie archivée, paiements suivis automatiquement.",
    ar: "فاتورة مقبولة، تصوير محفوظ، مدفوعات متتبّعة.",
  },
  "wf.4.t": { fr: "Fidélité", ar: "الوفاء" },
  "wf.4.d": {
    fr: "Rappels de contrôle qui ramènent le patient — année après année.",
    ar: "تذكيرات المراقبة التي تعيد المريض عامًا بعد عام.",
  },

  "cta.title": {
    fr: "Prêt à voir votre cabinet, en mieux ?",
    ar: "مستعد لرؤية عيادتك بشكل أفضل؟",
  },
  "cta.subtitle": {
    fr: "Entrez dans la démo interactive — explorez la vue dentiste, secrétaire et patient.",
    ar: "ادخل العرض التفاعلي — استكشف واجهة الطبيب والسكرتيرة والمريض.",
  },
  "cta.button": { fr: "Lancer la démo", ar: "ابدأ العرض" },

  "footer.rights": {
    fr: "Démo de portfolio · Vertical SaaS Maroc",
    ar: "عرض توضيحي · ساس عمودي المغرب",
  },
  "footer.note": {
    fr: "Prototype de démonstration. Données fictives.",
    ar: "نموذج توضيحي. بيانات وهمية.",
  },

  // ===== App chrome =====
  "role.dentist": { fr: "Dentiste", ar: "طبيب الأسنان" },
  "role.secretary": { fr: "Secrétaire", ar: "السكرتيرة" },
  "role.patient": { fr: "Patient", ar: "المريض" },
  "role.choose": { fr: "Choisissez un rôle pour la démo", ar: "اختر دورًا للعرض" },
  "role.enter": { fr: "Entrer", ar: "دخول" },
  "role.subtitle": {
    fr: "Trois expériences, une seule plateforme. Sélectionnez qui vous êtes.",
    ar: "ثلاث تجارب، منصة واحدة. اختر من أنت.",
  },
  "role.dentist.desc": {
    fr: "Vue clinique complète : agenda, dossiers, plans, imagerie et analytique.",
    ar: "رؤية سريرية كاملة: المواعيد، الملفات، الخطط، التصوير والتحليلات.",
  },
  "role.secretary.desc": {
    fr: "Accueil : rendez-vous, encaissements, informations patients.",
    ar: "الاستقبال: المواعيد، المدفوعات، معلومات المرضى.",
  },
  "role.patient.desc": {
    fr: "Portail patient : rendez-vous, plan de soins, documents et paiements.",
    ar: "بوابة المريض: المواعيد، خطة العلاج، الوثائق والمدفوعات.",
  },

  "nav.dashboard": { fr: "Tableau de bord", ar: "لوحة القيادة" },
  "nav.calendar": { fr: "Agenda", ar: "المواعيد" },
  "nav.patients": { fr: "Patients", ar: "المرضى" },
  "nav.treatments": { fr: "Plans de traitement", ar: "خطط العلاج" },
  "nav.imaging": { fr: "Imagerie", ar: "التصوير" },
  "nav.payments": { fr: "Paiements", ar: "المدفوعات" },
  "nav.analytics": { fr: "Analytique", ar: "التحليلات" },
  "nav.portal": { fr: "Mon espace", ar: "مساحتي" },
  "nav.backhome": { fr: "Site vitrine", ar: "الموقع" },
  "nav.switchrole": { fr: "Changer de rôle", ar: "تغيير الدور" },

  "app.search": { fr: "Rechercher un patient, un acte…", ar: "ابحث عن مريض أو إجراء…" },
  "app.today": { fr: "Aujourd’hui", ar: "اليوم" },
  "app.greeting.morning": { fr: "Bonjour", ar: "صباح الخير" },
  "app.new": { fr: "Nouveau", ar: "جديد" },
  "app.viewall": { fr: "Tout voir", ar: "عرض الكل" },

  "kpi.revenue": { fr: "Revenu du mois", ar: "دخل الشهر" },
  "kpi.appointments": { fr: "RDV cette semaine", ar: "مواعيد هذا الأسبوع" },
  "kpi.noshow": { fr: "Taux de no-show", ar: "نسبة الغياب" },
  "kpi.acceptance": { fr: "Acceptation des devis", ar: "قبول الفواتير" },
  "kpi.active": { fr: "Patients actifs", ar: "مرضى نشطون" },
  "kpi.pending": { fr: "Paiements en attente", ar: "مدفوعات معلّقة" },
  "kpi.due": { fr: "À encaisser aujourd’hui", ar: "للتحصيل اليوم" },

  "sec.agenda": { fr: "Agenda du jour", ar: "مواعيد اليوم" },
  "sec.recalls": { fr: "Rappels à envoyer", ar: "تذكيرات للإرسال" },
  "sec.revenuetrend": { fr: "Tendance du revenu", ar: "اتجاه الدخل" },
  "sec.actsmix": { fr: "Répartition des actes", ar: "توزيع الإجراءات" },
  "sec.recentpatients": { fr: "Patients récents", ar: "مرضى حديثون" },
  "sec.tasks": { fr: "Tâches", ar: "المهام" },

  "status.confirmed": { fr: "Confirmé", ar: "مؤكد" },
  "status.pending": { fr: "En attente", ar: "معلّق" },
  "status.arrived": { fr: "Arrivé", ar: "وصل" },
  "status.completed": { fr: "Terminé", ar: "منتهي" },
  "status.cancelled": { fr: "Annulé", ar: "ملغى" },
  "status.paid": { fr: "Payé", ar: "مدفوع" },
  "status.partial": { fr: "Partiel", ar: "جزئي" },
  "status.unpaid": { fr: "Impayé", ar: "غير مدفوع" },
  "status.accepted": { fr: "Accepté", ar: "مقبول" },
  "status.proposed": { fr: "Proposé", ar: "مقترح" },
  "status.sent": { fr: "Envoyé", ar: "مُرسل" },

  "reminder.send": { fr: "Envoyer le rappel", ar: "إرسال التذكير" },
  "reminder.sent": { fr: "Rappel envoyé", ar: "تم الإرسال" },
  "reminder.via": { fr: "via WhatsApp", ar: "عبر واتساب" },

  "patients.title": { fr: "Patients", ar: "المرضى" },
  "patients.count": { fr: "patients", ar: "مريض" },
  "patients.add": { fr: "Nouveau patient", ar: "مريض جديد" },
  "col.name": { fr: "Patient", ar: "المريض" },
  "col.phone": { fr: "Téléphone", ar: "الهاتف" },
  "col.last": { fr: "Dernière visite", ar: "آخر زيارة" },
  "col.next": { fr: "Prochain RDV", ar: "الموعد القادم" },
  "col.balance": { fr: "Solde", ar: "الرصيد" },
  "col.status": { fr: "Statut", ar: "الحالة" },

  "detail.overview": { fr: "Aperçu", ar: "نظرة عامة" },
  "detail.timeline": { fr: "Historique", ar: "السجل" },
  "detail.plan": { fr: "Plan de traitement", ar: "خطة العلاج" },
  "detail.imaging": { fr: "Imagerie", ar: "التصوير" },
  "detail.payments": { fr: "Paiements", ar: "المدفوعات" },
  "detail.alerts": { fr: "Alertes médicales", ar: "تنبيهات طبية" },
  "detail.family": { fr: "Famille", ar: "العائلة" },
  "detail.contact": { fr: "Contact", ar: "الاتصال" },
  "detail.age": { fr: "ans", ar: "سنة" },
  "detail.book": { fr: "Prendre RDV", ar: "حجز موعد" },
  "detail.message": { fr: "Message", ar: "رسالة" },

  "treat.title": { fr: "Plans de traitement", ar: "خطط العلاج" },
  "treat.tooth": { fr: "Dent", ar: "السن" },
  "treat.act": { fr: "Acte", ar: "الإجراء" },
  "treat.price": { fr: "Prix", ar: "الثمن" },
  "treat.total": { fr: "Total du devis", ar: "مجموع الفاتورة" },
  "treat.accept": { fr: "Marquer accepté", ar: "تحديد كمقبول" },
  "treat.share": { fr: "Partager le devis", ar: "مشاركة الفاتورة" },

  "imaging.title": { fr: "Coffre d’imagerie", ar: "خزنة التصوير" },
  "imaging.xray": { fr: "Radiographies", ar: "الأشعة" },
  "imaging.photos": { fr: "Photos avant / après", ar: "صور قبل / بعد" },
  "imaging.docs": { fr: "Documents", ar: "الوثائق" },
  "imaging.upload": { fr: "Ajouter", ar: "إضافة" },
  "imaging.before": { fr: "Avant", ar: "قبل" },
  "imaging.after": { fr: "Après", ar: "بعد" },

  "pay.title": { fr: "Paiements", ar: "المدفوعات" },
  "pay.record": { fr: "Enregistrer un paiement", ar: "تسجيل دفعة" },
  "pay.method": { fr: "Moyen", ar: "الطريقة" },
  "pay.cash": { fr: "Espèces", ar: "نقدًا" },
  "pay.card": { fr: "Carte", ar: "بطاقة" },
  "pay.cheque": { fr: "Chèque", ar: "شيك" },
  "pay.transfer": { fr: "Virement", ar: "تحويل" },
  "pay.collected": { fr: "Encaissé ce mois", ar: "المحصّل هذا الشهر" },
  "pay.outstanding": { fr: "Encours", ar: "المتبقي" },
  "pay.installments": { fr: "Échéancier", ar: "جدول الأقساط" },

  "analytics.title": { fr: "Analytique du cabinet", ar: "تحليلات العيادة" },
  "analytics.subtitle": {
    fr: "La santé de votre cabinet, en un coup d’œil.",
    ar: "صحة عيادتك في لمحة.",
  },

  "portal.welcome": { fr: "Bienvenue", ar: "مرحبًا" },
  "portal.next": { fr: "Votre prochain rendez-vous", ar: "موعدك القادم" },
  "portal.plan": { fr: "Votre plan de soins", ar: "خطة علاجك" },
  "portal.docs": { fr: "Vos documents", ar: "وثائقك" },
  "portal.pay": { fr: "Vos paiements", ar: "مدفوعاتك" },
  "portal.confirm": { fr: "Confirmer ma présence", ar: "تأكيد الحضور" },
  "portal.reschedule": { fr: "Reprogrammer", ar: "إعادة جدولة" },

  "common.mad": { fr: "MAD", ar: "درهم" },
  "common.close": { fr: "Fermer", ar: "إغلاق" },
  "common.save": { fr: "Enregistrer", ar: "حفظ" },
  "common.demo": { fr: "Démo", ar: "عرض" },
  "common.thismonth": { fr: "ce mois", ar: "هذا الشهر" },
};

interface Store {
  lang: Lang;
  dir: "ltr" | "rtl";
  role: Role;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  setRole: (r: Role) => void;
  t: (key: string) => string;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({
  children,
  initialRole = "dentist",
}: {
  children: React.ReactNode;
  initialRole?: Role;
}) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [role, setRoleState] = useState<Role>(initialRole);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const l = (localStorage.getItem("dcos-lang") as Lang) || "fr";
    const r = (localStorage.getItem("dcos-role") as Role) || initialRole;
    setLangState(l);
    setRoleState(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the document direction/lang in sync (no persistence here — the
  // setters own persistence, to avoid clobbering the hydrated value).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("dcos-lang", l);
  }, []);
  const toggleLang = useCallback(
    () =>
      setLangState((p) => {
        const next = p === "fr" ? "ar" : "fr";
        localStorage.setItem("dcos-lang", next);
        return next;
      }),
    []
  );
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem("dcos-role", r);
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = DICT[key];
      if (!entry) return key;
      return entry[lang] ?? entry.fr;
    },
    [lang]
  );

  const value = useMemo<Store>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      role,
      setLang,
      toggleLang,
      setRole,
      t,
    }),
    [lang, role, setLang, toggleLang, setRole, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
