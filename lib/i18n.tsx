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
  "portal.confirmed": { fr: "Présence confirmée", ar: "تم تأكيد الحضور" },
  "portal.noappt": { fr: "Aucun rendez-vous à venir", ar: "لا موعد قادم" },
  "portal.noappt.sub": { fr: "Contactez le cabinet pour prendre rendez-vous.", ar: "تواصل مع العيادة لتحديد موعد." },
  "portal.awaiting": { fr: "En attente de confirmation du cabinet", ar: "في انتظار تأكيد العيادة" },
  // Échéancier / paiements patient
  "portal.remaining": { fr: "Reste à payer", ar: "المتبقّي للدفع" },
  "portal.paid": { fr: "Déjà réglé", ar: "المدفوع" },
  "portal.total": { fr: "Total du plan", ar: "مجموع الخطة" },
  "portal.uptodate": { fr: "À jour — rien à régler", ar: "محدَّث — لا شيء للدفع" },
  "portal.receipt": { fr: "Reçu", ar: "إيصال" },
  "portal.receipt.done": { fr: "Reçu téléchargé", ar: "تم تحميل الإيصال" },
  // Coffre
  "portal.vault": { fr: "Mon coffre médical", ar: "خزنتي الطبية" },
  "portal.vault.empty": { fr: "Aucun document pour le moment.", ar: "لا وثائق حاليًا." },
  // Reschedule modal
  "resched.title": { fr: "Reprogrammer mon rendez-vous", ar: "إعادة جدولة موعدي" },
  "resched.current": { fr: "Rendez-vous actuel", ar: "الموعد الحالي" },
  "resched.newday": { fr: "Nouveau jour", ar: "اليوم الجديد" },
  "resched.newtime": { fr: "Nouvelle heure", ar: "الساعة الجديدة" },
  "resched.confirm": { fr: "Demander ce créneau", ar: "طلب هذا الموعد" },
  "resched.done": { fr: "Demande envoyée — le cabinet confirmera", ar: "تم إرسال الطلب — ستؤكّد العيادة" },
  "resched.note": { fr: "Le cabinet validera votre nouveau créneau.", ar: "ستؤكّد العيادة موعدكم الجديد." },
  // Langue de contact
  "portal.language": { fr: "Langue de contact", ar: "لغة التواصل" },
  "portal.language.hint": { fr: "Vos rappels WhatsApp seront envoyés dans cette langue.", ar: "ستُرسَل تذكيرات واتساب بهذه اللغة." },
  "portal.language.saved": { fr: "Langue enregistrée", ar: "تم حفظ اللغة" },
  // Pré-inscription
  "portal.prereg": { fr: "Pré-inscription en ligne", ar: "التسجيل المسبق" },
  "portal.prereg.sub": { fr: "Nouveau patient ? Créez votre dossier avant votre première visite.", ar: "مريض جديد؟ أنشئ ملفك قبل زيارتك الأولى." },
  "portal.prereg.cta": { fr: "Pré-inscrire un patient", ar: "تسجيل مريض مسبقًا" },
  "prereg.title": { fr: "Pré-inscription", ar: "التسجيل المسبق" },
  "prereg.sub": { fr: "Le cabinet validera votre dossier avant le rendez-vous.", ar: "ستتحقق العيادة من ملفكم قبل الموعد." },
  "prereg.done": { fr: "Dossier envoyé — le cabinet vous confirmera", ar: "تم إرسال الملف — ستؤكّد العيادة" },
  "prereg.submit": { fr: "Envoyer ma pré-inscription", ar: "إرسال تسجيلي المسبق" },
  "prereg.badge": { fr: "Pré-inscrit", ar: "مسجّل مسبقًا" },
  "field.reason": { fr: "Motif / antécédents", ar: "السبب / السوابق" },

  // ===== Portal Tier 2 =====
  "portal.tab.home": { fr: "Accueil", ar: "الرئيسية" },
  "portal.tab.care": { fr: "Mes soins", ar: "علاجاتي" },
  "portal.tab.file": { fr: "Mon dossier", ar: "ملفي" },
  "portal.book": { fr: "Demander un RDV", ar: "طلب موعد" },
  "portal.contact": { fr: "Écrire au cabinet", ar: "مراسلة العيادة" },
  "portal.contact.tmpl": { fr: "Bonjour, je suis {name}. Je souhaite contacter le cabinet au sujet de : ", ar: "مرحبًا، أنا {name}. أودّ التواصل مع العيادة بخصوص: " },

  // Booking modal
  "book.title": { fr: "Demander un rendez-vous", ar: "طلب موعد" },
  "book.sub": { fr: "Le cabinet confirmera votre demande.", ar: "ستؤكّد العيادة طلبكم." },
  "book.reason": { fr: "Motif de la visite", ar: "سبب الزيارة" },
  "book.practitioner": { fr: "Praticien souhaité", ar: "الطبيب المطلوب" },
  "book.request": { fr: "Envoyer la demande", ar: "إرسال الطلب" },
  "book.done": { fr: "Demande de RDV envoyée", ar: "تم إرسال طلب الموعد" },
  "book.note": { fr: "Votre demande arrive en « en attente » ; le cabinet la confirme.", ar: "يصل طلبكم كـ « قيد الانتظار » وتؤكّده العيادة." },

  // Jour J / check-in
  "portal.todaybadge": { fr: "C’est aujourd’hui", ar: "اليوم" },
  "portal.checkin": { fr: "Je suis arrivé(e)", ar: "لقد وصلت" },
  "portal.checkedin": { fr: "Arrivée signalée", ar: "تم الإبلاغ عن وصولك" },

  // Carnet de soins
  "portal.history": { fr: "Mon carnet de soins", ar: "دفتر علاجاتي" },
  "portal.history.empty": { fr: "Aucune visite passée pour le moment.", ar: "لا زيارات سابقة حاليًا." },

  // Devis acceptance
  "portal.proposed": { fr: "Devis à valider", ar: "فاتورة للموافقة" },
  "portal.plan.accepted": { fr: "Votre plan de soins", ar: "خطة علاجك" },
  "plan.accept": { fr: "Accepter le devis", ar: "قبول الفاتورة" },
  "plan.accepted.done": { fr: "Devis accepté — merci !", ar: "تم قبول الفاتورة — شكرًا!" },
  "plan.viewpdf": { fr: "Voir le devis (PDF)", ar: "عرض الفاتورة (PDF)" },
  "plan.consent": { fr: "En acceptant, vous confirmez votre consentement aux soins et au montant indiqué.", ar: "بالقبول، تؤكّدون موافقتكم على العلاج والمبلغ المذكور." },
  "consent.title": { fr: "Consentement au devis", ar: "الموافقة على الفاتورة" },

  // Poursuivre mon traitement
  "portal.continue": { fr: "Poursuivre mon traitement", ar: "متابعة علاجي" },
  "portal.continue.sub": { fr: "Prochaines étapes de votre plan accepté", ar: "الخطوات القادمة من خطتكم المقبولة" },
  "portal.step.book": { fr: "Prendre RDV", ar: "حجز موعد" },
  "portal.continue.done": { fr: "Traitement terminé — bravo !", ar: "انتهى العلاج — أحسنت!" },

  // Rappels
  "portal.recalls": { fr: "Mes rappels de soins", ar: "تذكيرات علاجي" },
  "portal.recalls.empty": { fr: "Aucun rappel prévu.", ar: "لا تذكيرات مقرّرة." },
  "portal.recall.book": { fr: "Reprendre RDV", ar: "حجز موعد" },
  "portal.recallopt": { fr: "Recevoir mes rappels de soins", ar: "استقبال تذكيرات علاجي" },
  "portal.recallopt.hint": { fr: "Détartrage, contrôles, suivis cliniques — jamais de publicité.", ar: "التقليح، المراقبة، المتابعة السريرية — بلا إعلانات." },

  // Profil médical
  "portal.medical": { fr: "Mon profil médical", ar: "ملفي الطبي" },
  "portal.medical.none": { fr: "Aucune alerte médicale enregistrée.", ar: "لا تنبيهات طبية مسجّلة." },
  "portal.medical.propose": { fr: "Proposer une mise à jour", ar: "اقتراح تحديث" },
  "portal.medical.hint": { fr: "Ces informations sont validées par le cabinet.", ar: "تتحقّق العيادة من هذه المعلومات." },
  "portal.medupdate.tmpl": { fr: "Bonjour, je suis {name}. Je souhaite mettre à jour mes informations médicales : ", ar: "مرحبًا، أنا {name}. أودّ تحديث معلوماتي الطبية: " },

  // Réactivation
  "portal.missed": { fr: "Un rendez-vous n’a pas eu lieu", ar: "موعد لم يتم" },
  "portal.missed.sub": { fr: "Souhaitez-vous le reprogrammer ?", ar: "هل تودّون إعادة جدولته؟" },
  "portal.missed.cta": { fr: "Reprendre rendez-vous", ar: "إعادة الحجز" },

  // ===== Portal Tier 3 =====
  // Compte famille
  "portal.family": { fr: "Ma famille", ar: "عائلتي" },
  "portal.member.you": { fr: "Vous", ar: "أنت" },
  "portal.member.child": { fr: "Enfant", ar: "طفل" },
  "portal.household": { fr: "Vue famille", ar: "نظرة العائلة" },
  "portal.household.balance": { fr: "Solde du foyer", ar: "رصيد العائلة" },
  "portal.household.nextrdv": { fr: "Prochain RDV", ar: "الموعد القادم" },
  "portal.household.noappt": { fr: "Aucun RDV à venir", ar: "لا موعد قادم" },
  "portal.household.recallsdue": { fr: "rappel(s)", ar: "تذكير" },
  "portal.viewing": { fr: "Espace de", ar: "مساحة" },

  // E-signature
  "portal.tosign": { fr: "Documents à signer", ar: "وثائق للتوقيع" },
  "portal.tosign.empty": { fr: "Aucun document en attente de signature.", ar: "لا وثائق بانتظار التوقيع." },
  "portal.sign.cta": { fr: "Signer", ar: "توقيع" },
  "sign.title": { fr: "Signer le consentement", ar: "توقيع الموافقة" },
  "sign.sub": { fr: "Dessinez votre signature dans le cadre ci-dessous.", ar: "ارسم توقيعك في الإطار أدناه." },
  "sign.placeholder": { fr: "Signez ici", ar: "وقّع هنا" },
  "sign.clear": { fr: "Effacer", ar: "مسح" },
  "sign.confirm": { fr: "Signer le document", ar: "توقيع الوثيقة" },
  "sign.done": { fr: "Document signé — classé dans votre coffre", ar: "تم توقيع الوثيقة — حُفظت في خزنتك" },
  "consent.signed": { fr: "Consentement signé", ar: "موافقة موقّعة" },

  // Export dossier
  "portal.export": { fr: "Exporter mon dossier", ar: "تصدير ملفي" },
  "portal.export.done": { fr: "Dossier exporté (PDF)", ar: "تم تصدير الملف (PDF)" },

  // Agenda .ics
  "portal.addcal": { fr: "Ajouter à mon calendrier", ar: "إضافة إلى تقويمي" },
  "portal.addcal.done": { fr: "Fichier calendrier téléchargé", ar: "تم تحميل ملف التقويم" },

  // Renouvellement d'ordonnance
  "portal.renew": { fr: "Demander un renouvellement", ar: "طلب تجديد" },
  "portal.renew.tmpl": { fr: "Bonjour, je suis {name}. Je souhaite renouveler mon ordonnance : {doc}.", ar: "مرحبًا، أنا {name}. أودّ تجديد وصفتي الطبية: {doc}." },

  "common.mad": { fr: "MAD", ar: "درهم" },
  "common.close": { fr: "Fermer", ar: "إغلاق" },
  "common.save": { fr: "Enregistrer", ar: "حفظ" },
  "common.demo": { fr: "Démo", ar: "عرض" },
  "common.thismonth": { fr: "ce mois", ar: "هذا الشهر" },
  "common.cancel": { fr: "Annuler", ar: "إلغاء" },
  "common.create": { fr: "Créer", ar: "إنشاء" },
  "common.confirm": { fr: "Confirmer", ar: "تأكيد" },
  "common.download": { fr: "Télécharger", ar: "تحميل" },
  "common.view": { fr: "Voir", ar: "عرض" },
  "common.optional": { fr: "facultatif", ar: "اختياري" },

  // ===== "Nouveau" quick-create menu =====
  "new.menu": { fr: "Créer", ar: "إنشاء" },
  "new.patient": { fr: "Nouveau patient", ar: "مريض جديد" },
  "new.appointment": { fr: "Nouveau rendez-vous", ar: "موعد جديد" },
  "new.plan": { fr: "Nouveau plan de traitement", ar: "خطة علاج جديدة" },
  "new.payment": { fr: "Enregistrer un paiement", ar: "تسجيل دفعة" },
  "new.document": { fr: "Nouveau document", ar: "وثيقة جديدة" },

  // ===== Search =====
  "search.none": { fr: "Aucun résultat", ar: "لا توجد نتائج" },
  "search.hint": { fr: "Rechercher un patient…", ar: "ابحث عن مريض…" },

  // ===== Form fields =====
  "field.name": { fr: "Nom complet", ar: "الاسم الكامل" },
  "field.phone": { fr: "Téléphone", ar: "الهاتف" },
  "field.phone.hint": { fr: "pour les rappels WhatsApp", ar: "لتذكيرات واتساب" },
  "field.age": { fr: "Âge", ar: "العمر" },
  "field.gender": { fr: "Sexe", ar: "الجنس" },
  "field.city": { fr: "Ville", ar: "المدينة" },
  "field.male": { fr: "Homme", ar: "ذكر" },
  "field.female": { fr: "Femme", ar: "أنثى" },
  "field.tags": { fr: "Étiquettes", ar: "الوسوم" },
  "field.alerts": { fr: "Alertes médicales", ar: "تنبيهات طبية" },
  "field.amount": { fr: "Montant", ar: "المبلغ" },
  "field.commalist": { fr: "séparés par des virgules", ar: "مفصولة بفواصل" },

  // ===== Appointment modal =====
  "appt.existing": { fr: "Patient existant", ar: "مريض موجود" },
  "appt.newpatient": { fr: "Nouveau patient", ar: "مريض جديد" },
  "appt.time": { fr: "Heure", ar: "الساعة" },
  "appt.duration": { fr: "Durée (min)", ar: "المدة (دقيقة)" },
  "appt.act": { fr: "Acte", ar: "الإجراء" },
  "appt.practitioner": { fr: "Praticien", ar: "الطبيب" },
  "appt.created": { fr: "Rendez-vous créé", ar: "تم إنشاء الموعد" },

  // ===== Plan modal =====
  "plan.lines": { fr: "Actes du devis", ar: "بنود الفاتورة" },
  "plan.addline": { fr: "Ajouter un acte", ar: "إضافة إجراء" },
  "plan.created": { fr: "Plan de traitement créé", ar: "تم إنشاء خطة العلاج" },
  "plan.preparepdf": { fr: "Préparer le devis (PDF)", ar: "تحضير الفاتورة (PDF)" },
  "plan.sent": { fr: "Devis envoyé au patient", ar: "أُرسلت الفاتورة للمريض" },
  "plan.sending": { fr: "Génération du PDF…", ar: "جارٍ إنشاء PDF…" },

  // ===== Documents =====
  "doc.new": { fr: "Nouveau document", ar: "وثيقة جديدة" },
  "doc.addexisting": { fr: "Ajouter à un document existant", ar: "إضافة إلى وثيقة موجودة" },
  "doc.mode.new": { fr: "Créer un document", ar: "إنشاء وثيقة" },
  "doc.mode.add": { fr: "Ajouter à un document", ar: "إضافة لوثيقة" },
  "doc.title": { fr: "Titre du document", ar: "عنوان الوثيقة" },
  "doc.category": { fr: "Catégorie", ar: "الفئة" },
  "doc.files": { fr: "Fichiers", ar: "الملفات" },
  "doc.choosefiles": { fr: "Choisir des fichiers ou une image", ar: "اختر ملفات أو صورة" },
  "doc.pick": { fr: "Sélectionner un document", ar: "اختر وثيقة" },
  "doc.added": { fr: "Document mis à jour", ar: "تم تحديث الوثيقة" },
  "doc.created": { fr: "Document créé", ar: "تم إنشاء الوثيقة" },
  "doc.empty": { fr: "Aucun document. Cliquez sur « Ajouter ».", ar: "لا توجد وثائق. اضغط « إضافة »." },
  "doc.files.count": { fr: "fichier(s)", ar: "ملف/ملفات" },
  "cat.xray": { fr: "Radiographie", ar: "أشعة" },
  "cat.photo": { fr: "Photo avant / après", ar: "صورة قبل / بعد" },
  "cat.doc": { fr: "Document", ar: "وثيقة" },

  // ===== Message / reminder =====
  "msg.title": { fr: "Envoyer un message", ar: "إرسال رسالة" },
  "msg.to": { fr: "À", ar: "إلى" },
  "msg.placeholder": { fr: "Votre message…", ar: "رسالتك…" },
  "msg.send": { fr: "Ouvrir dans WhatsApp", ar: "فتح في واتساب" },
  "msg.sent": { fr: "WhatsApp ouvert", ar: "تم فتح واتساب" },
  "msg.nophone": {
    fr: "Aucun numéro enregistré pour ce patient.",
    ar: "لا يوجد رقم مسجّل لهذا المريض.",
  },
  "msg.whatsapphint": {
    fr: "S’ouvre dans WhatsApp avec le message pré-rempli, prêt à envoyer.",
    ar: "يفتح في واتساب مع الرسالة المُعبّأة مسبقًا، جاهزة للإرسال.",
  },
  "msg.reminder.tmpl": {
    fr: "Bonjour, ceci est un rappel de votre rendez-vous au cabinet. À bientôt !",
    ar: "مرحبًا، هذا تذكير بموعدك في العيادة. إلى اللقاء!",
  },
  // Personalized templates. Placeholders: {name} {date} {time} {act} {reason} {clinic}
  "msg.tmpl.blank": { fr: "Bonjour {name}, ", ar: "مرحبًا {name}، " },
  "msg.tmpl.reminder": {
    fr: "Bonjour {name}, petit rappel de votre rendez-vous au {clinic} le {date} à {time}{act}. Merci de confirmer votre présence. À bientôt !",
    ar: "مرحبًا {name}، تذكير بموعدكم في {clinic} يوم {date} على الساعة {time}{act}. نرجو تأكيد الحضور. إلى اللقاء!",
  },
  "msg.tmpl.reminder.noappt": {
    fr: "Bonjour {name}, petit rappel de votre suivi au {clinic}. Merci de nous recontacter pour fixer votre prochain rendez-vous. À bientôt !",
    ar: "مرحبًا {name}، تذكير بمتابعتكم في {clinic}. نرجو التواصل معنا لتحديد موعدكم القادم. إلى اللقاء!",
  },
  "msg.tmpl.recall": {
    fr: "Bonjour {name}, il est temps pour votre {reason} au {clinic}. Souhaitez-vous que l’on vous réserve un créneau ? À bientôt !",
    ar: "مرحبًا {name}، حان وقت {reason} في {clinic}. هل تودّون أن نحجز لكم موعدًا؟ إلى اللقاء!",
  },
  "msg.clinic": { fr: "Cabinet Dentaire", ar: "عيادة الأسنان" },
  "appt.day": { fr: "Jour", ar: "اليوم" },
  "appt.today": { fr: "aujourd’hui", ar: "اليوم" },
  "cal.noappts": { fr: "Aucun rendez-vous ce jour", ar: "لا مواعيد في هذا اليوم" },
  "cal.week": { fr: "Semaine", ar: "الأسبوع" },

  // ===== Row actions =====
  "act.message": { fr: "Envoyer un message", ar: "إرسال رسالة" },
  "act.reminder": { fr: "Rappel de RDV", ar: "تذكير بالموعد" },
  "act.delete": { fr: "Supprimer le compte", ar: "حذف الحساب" },
  "act.book": { fr: "Prendre RDV", ar: "حجز موعد" },
  "act.reminded": { fr: "Rappel envoyé", ar: "تم إرسال التذكير" },
  "del.title": { fr: "Supprimer ce patient ?", ar: "حذف هذا المريض؟" },
  "del.desc": {
    fr: "Le compte et tout son historique (RDV, plans, paiements, documents) seront supprimés. Action irréversible.",
    ar: "سيتم حذف الحساب وكل سجله (المواعيد، الخطط، المدفوعات، الوثائق). إجراء لا رجعة فيه.",
  },

  // ===== Payments =====
  "pay.recorded": { fr: "Paiement enregistré", ar: "تم تسجيل الدفعة" },
  "pay.selectpatient": { fr: "Choisir un patient", ar: "اختر مريضًا" },
  "pay.new": { fr: "Nouveau paiement", ar: "دفعة جديدة" },
};

interface Store {
  lang: Lang;
  dir: "ltr" | "rtl";
  role: Role;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  setRole: (r: Role) => void;
  t: (key: string) => string;
  tIn: (l: Lang, key: string) => string; // translate in a specific language (e.g. patient's preference)
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

  const tIn = useCallback((l: Lang, key: string) => {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[l] ?? entry.fr;
  }, []);

  const value = useMemo<Store>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      role,
      setLang,
      toggleLang,
      setRole,
      t,
      tIn,
    }),
    [lang, role, setLang, toggleLang, setRole, t, tIn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
