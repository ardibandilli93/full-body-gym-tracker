export const LEGAL_VERSION = '2026-09-29';

export type LegalDocumentId = 'privacy' | 'terms' | 'cookies' | 'refunds';

export type PolicySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PolicyDocument = {
  id: LegalDocumentId;
  title: string;
  summary: string;
  sections: PolicySection[];
};

const operatorName = process.env.EXPO_PUBLIC_LEGAL_NAME?.trim() || 'Full Body';
const privacyEmail = process.env.EXPO_PUBLIC_PRIVACY_EMAIL?.trim();
const contact = privacyEmail || 'the support contact published with the app in the App Store or Google Play listing';

export const legalConfigurationComplete = Boolean(privacyEmail && process.env.EXPO_PUBLIC_LEGAL_NAME?.trim());

const privacy: PolicyDocument = {
  id: 'privacy',
  title: 'Privacy notice',
  summary: `How ${operatorName} uses and protects account, body-measurement, and workout data.`,
  sections: [
    {
      heading: 'Who is responsible',
      paragraphs: [
        `${operatorName}, an independent individual developer operating the Full Body project, is responsible for the personal data described here. You can contact the developer at ${contact}.`,
        `This notice is version ${LEGAL_VERSION} and applies to the Full Body mobile app and standalone web tracker.`,
      ],
    },
    {
      heading: 'Data we collect',
      paragraphs: ['We collect only the information needed to create your account, build your routine, record your workouts, and sync progress when you choose to use an account.'],
      bullets: [
        'Account data: email address, account identifier, and authentication records. Supabase handles your password; Full Body does not store a readable copy.',
        'Profile data: preferred name, age, gender selection, unit preference, height, current weight, and goal weight.',
        'Training data: routine choices, exercises, sets, weights, repetitions, duration, notes, workout dates, completion status, and calories you enter.',
        'Necessary technical data: encrypted sign-in tokens, local sync state, and security or error records produced when the service is used.',
      ],
    },
    {
      heading: 'Data we do not collect',
      paragraphs: ['The current app does not use advertising identifiers, analytics pixels, third-party behavioural analytics, precise location, contacts, camera, microphone, photos, biometric identifiers, HealthKit, Health Connect, or connected wearable data. We do not sell personal data and do not use it for targeted advertising.'],
    },
    {
      heading: 'Why we use data',
      bullets: [
        'To create and secure your account, keep you signed in, and sync your data across devices.',
        'To create the routine you request and show your workout history and comparisons.',
        'To save your preferences and provide offline use.',
        'To maintain security, diagnose failures, comply with law, and respond to rights requests.',
      ],
      paragraphs: [
        'Where UK or EU data-protection law applies, account and service data is processed to perform our agreement with you. Security processing is based on our legitimate interest in protecting the service. Body measurements and workout records may reveal health information, so we ask for separate explicit consent before collecting them. You may withdraw that consent by deleting your account and data.',
      ],
    },
    {
      heading: 'Storage and sharing',
      paragraphs: [
        'The app keeps an offline copy in its private SQLite database. Sign-in tokens are kept in secure device storage on iOS and Android. If you sign in, your account and training data are sent over encrypted connections to Supabase, our authentication and database processor. The current Supabase project is hosted in the eu-west-1 region in Ireland.',
        'We share data only with processors needed to operate the service, when you direct us to, or when law requires it. Apple and Google separately process store, download, and device information under their own notices. No advertising or analytics SDK receives your workout or body data.',
      ],
    },
    {
      heading: 'Retention and deletion',
      paragraphs: [
        'Account and training data is kept while your account is active so the requested history remains available. Use Delete account in Profile to remove the account and associated active cloud and local records. Infrastructure backups and limited legal or security records may remain only for the period reasonably required to restore systems, prevent fraud, resolve disputes, or meet legal duties.',
      ],
    },
    {
      heading: 'Your choices and rights',
      paragraphs: [
        'Profile lets you export a copy and delete your account. Depending on where you live, you may also ask to access, correct, restrict, object to, or receive a portable copy of personal data, withdraw consent, and complain to your data-protection authority. We do not discriminate against anyone for exercising a privacy right. Contact us using the details above if the in-app controls do not cover your request.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: ['Full Body is for adults aged 18 or older. We do not knowingly collect personal data from anyone under 18. Contact us if you believe a child has created an account.'],
    },
    {
      heading: 'Security, breaches, and decisions',
      paragraphs: [
        'We use access controls, row-level database rules, encrypted transport, secure token storage, and least-privilege permissions. No system is perfectly secure. If a reportable breach occurs, we will notify affected people and regulators as required.',
        'The app calculates workout summaries from the values you enter. It does not make legal, medical, employment, credit, or similarly significant automated decisions.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: ['We will update this notice before materially changing what we collect or why. If a change requires new consent, we will ask before the new processing begins.'],
    },
  ],
};

const terms: PolicyDocument = {
  id: 'terms',
  title: 'Terms and conditions',
  summary: 'The rules for using Full Body and the limits of its fitness information.',
  sections: [
    {
      heading: 'Agreement and eligibility',
      paragraphs: [`These terms are version ${LEGAL_VERSION}. By creating an account, you agree to them. You must be at least 18 and legally able to enter this agreement. If you do not agree, do not create or use an account.`],
    },
    {
      heading: 'What the app provides',
      paragraphs: ['Full Body is a self-directed workout-planning and logging tool. Exercise descriptions, progress comparisons, body projections, and calorie entries are informational. They are not medical advice, diagnosis, treatment, physiotherapy, or a guarantee of results. The visual avatar is an illustration and does not predict how your body will look.'],
    },
    {
      heading: 'Train safely',
      paragraphs: ['You are responsible for choosing exercises, resistance, and technique suitable for you. Stop if you feel pain, dizziness, or unusual symptoms. Seek qualified medical or fitness advice before training if you are injured, pregnant, have a health condition, take relevant medication, or are unsure whether exercise is appropriate. Do not use the app for emergencies.'],
    },
    {
      heading: 'Your account and content',
      paragraphs: ['Keep your credentials confidential and provide accurate information. You retain ownership of the workout data you enter. You give us permission to host, copy, and process it only as needed to provide, secure, and maintain the service.'],
    },
    {
      heading: 'Acceptable use',
      paragraphs: ['Do not misuse the service, attempt unauthorised access, interfere with other users, upload unlawful or harmful material, probe security without written permission, or use the app in a way that violates law or another person’s rights.'],
    },
    {
      heading: 'Our content and licence',
      paragraphs: ['The app, brand, interface, original text, and artwork are protected by applicable intellectual-property laws. We grant you a personal, limited, revocable, non-transferable licence to use the app for its intended purpose. Open-source components remain governed by their own licences.'],
    },
    {
      heading: 'Availability and changes',
      paragraphs: ['We may fix, update, suspend, or discontinue parts of the service. We will take reasonable care, but cannot promise uninterrupted or error-free availability. Export your data before deleting an account or when you need an independent copy.'],
    },
    {
      heading: 'Responsibility',
      paragraphs: ['Nothing in these terms excludes rights or liability that cannot legally be excluded, including applicable consumer rights and liability for fraud, fraudulent misrepresentation, death, or personal injury caused by negligence where the law prohibits exclusion. To the extent the law permits, we are not responsible for indirect or unforeseeable losses or for harm caused by ignoring safety guidance or entering inaccurate data.'],
    },
    {
      heading: 'Ending use and disputes',
      paragraphs: ['You may stop using the app and delete your account at any time. We may restrict access for serious misuse, security risk, or legal necessity. Mandatory consumer protections and courts available in your home country remain available. Contact us first so we can try to resolve a concern.'],
    },
  ],
};

const cookies: PolicyDocument = {
  id: 'cookies',
  title: 'Cookie and device-storage policy',
  summary: 'The necessary storage Full Body uses, with no advertising or analytics tracking.',
  sections: [
    {
      heading: 'What the app stores',
      paragraphs: ['Mobile apps use device storage rather than ordinary browser cookies. The Full Body web build may use browser storage. Privacy rules often treat these technologies in a similar way.'],
      bullets: [
        'Secure storage keeps the token needed to maintain your signed-in session.',
        'SQLite stores your profile, routine, workout records, and pending sync operations so the app works offline.',
        'The web build uses local storage for the same requested workout-history and session functions.',
      ],
    },
    {
      heading: 'No non-essential tracking',
      paragraphs: ['The current app does not set advertising, cross-site tracking, personalisation, or analytics cookies and does not load tracking pixels. Because it uses only storage necessary to provide the service you request, it does not show a consent banner. We will add prior opt-in controls before introducing any non-essential storage.'],
    },
    {
      heading: 'Your controls',
      paragraphs: ['You can sign out, delete your account in Profile, clear the app’s storage through device settings, or remove browser site data. Blocking necessary storage may prevent sign-in, offline saving, or sync from working.'],
    },
  ],
};

const refunds: PolicyDocument = {
  id: 'refunds',
  title: 'Refund policy',
  summary: 'Full Body currently has no charges, subscriptions, in-app purchases, or hidden fees.',
  sections: [
    {
      heading: 'Current service',
      paragraphs: ['The current version is free to use and does not take payment, start a trial, renew a subscription, or add fees. There is therefore no purchase to refund.'],
    },
    {
      heading: 'Future paid features',
      paragraphs: ['Before introducing a paid feature, we will show the price, billing period, renewal terms, cancellation method, and any trial terms before purchase, and update this policy. We will not use preselected paid options or disguised charges.'],
    },
    {
      heading: 'Store purchases and legal rights',
      paragraphs: ['If a future purchase is processed by Apple or Google, refund requests may also be handled under that store’s rules. This policy does not reduce refund, repair, replacement, cancellation, or other rights that applicable consumer law gives you. Contact us through the app-store support details if a future charge appears incorrect.'],
    },
  ],
};

export const policyDocuments: Record<LegalDocumentId, PolicyDocument> = {
  privacy,
  terms,
  cookies,
  refunds,
};

export function isLegalDocumentId(value: string | string[] | undefined): value is LegalDocumentId {
  return typeof value === 'string' && value in policyDocuments;
}
