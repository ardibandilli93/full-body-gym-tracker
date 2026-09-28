# Full Body compliance and release audit

Audit date: 28 September 2026. Scope: Expo mobile application, its exported web build, the legacy Vite workout tracker, Supabase backend, installed production SDKs, bundled media, user-facing claims, and local browser/device storage.

This is an engineering and product-compliance review, not a substitute for advice from a lawyer licensed in every launch market. No honest audit can promise zero legal risk. The controls below reduce concrete risks in the current code; the unresolved facts and professional reviews are release gates.

## Release decision

**Do not publish yet.** The software controls are substantially improved, but these business facts are missing:

1. The publisher's legal name, trading name, physical/postal address, privacy/support email, country of establishment, company or sole-trader status, registration number, and VAT/tax status.
2. The first launch countries and whether the publisher will actively market to users outside them.
3. Written confirmation that the publisher owns or may commercially use every logo, athlete image, gym background, icon, animation, exercise description, and optional exercise GIF.
4. A formal trade-mark clearance for **Full Body** and its icon in the launch countries, at least for relevant Nice classes 9, 41, 42, and possibly 44.
5. A lawyer's review of the final controller identity, governing-law/dispute wording, liability language, privacy lawful bases, and health-data consent for the chosen markets.

Run `npm run compliance:check` in `mobile/` before a release. It intentionally fails until the legal identity fields are configured.

## Data inventory and minimisation

| Data | Location | Purpose | Current control |
| --- | --- | --- | --- |
| Email, account ID, auth records | Supabase Auth; secure token on device | Account, sign-in, sync | Required for cloud accounts; no social login; password is handled by Supabase |
| Preferred name | SQLite and Supabase | Personalised greeting | User-chosen; editable |
| Age | SQLite and Supabase | Enforce 18+ eligibility | Numeric only; database constraint 18–120 |
| Avatar gender selection | SQLite and Supabase | Select requested avatar presentation | Male, female, or other; no inference or advertising use |
| Units, height, current and goal weight | SQLite and Supabase | Display units, body projection, goals | Separate explicit health-data consent before collection |
| Routine and workout records | SQLite and Supabase | Logging, comparison, sync | Separate explicit health-data consent; export and deletion controls |
| Notes and calorie values | SQLite and Supabase | User-requested session record | Free text length/JSON payload limits; calorie values are user entered |
| Session token | iOS/Android secure storage; browser auth storage | Keep the user signed in | Necessary storage only; removed on sign-out/deletion |
| Sync queue and local error text | SQLite | Reliable offline sync | Local operational data; deleted with the account |

The app does **not** currently request or collect precise location, contacts, camera, microphone, photos, advertising IDs, biometric identity, HealthKit, Health Connect, wearable data, or payment information. Do not add any of these without a new data-map, purpose/necessity review, policy update, store disclosure, and consent or permission flow where required.

## SDK, analytics, tracking, and external-service audit

| Service or SDK | Runtime role | Personal-data observation | Decision |
| --- | --- | --- | --- |
| Supabase JS/Auth/Postgres/Edge Functions | Authentication, sync, account deletion | Email, account ID, profile and fitness data, normal service/network metadata | Retained; necessary processor; project region is `eu-west-1` Ireland |
| Expo / React Native modules | UI, storage, routing, animation, network state | No app analytics SDK found | Retained; review store privacy manifests/data-safety output on each build |
| Lottie React Native / local JSON | Local recap animation | No network or user data | Retained; honours reduced-motion preference |
| Reanimated | Local UI animation | No network or user data | Retained; reduced motion used for major animations |
| NetInfo | Detect connectivity for sync | Reads connection state; no analytics destination | Retained for offline sync |
| hCaptcha packages | Previously present | Would contact hCaptcha and collect anti-abuse device/network signals | Removed from mobile and legacy web because CAPTCHA is disabled |
| Google Fonts import | Previously present in legacy web | Would disclose IP/user agent to Google on page load | Removed; system fonts used |
| GitHub raw exercise-GIF fallback | Previously present in legacy web | Would disclose IP/user agent to GitHub when demos opened | Runtime fallback removed; optional local asset-download script remains |
| Advertising, attribution, crash reporting, product analytics | None found | None | Keep absent unless a new audit and opt-in/legal-basis review approves it |

No fake reviews or testimonials were found. The unsupported phrase “proven split” was removed. No price, trial, subscription, or checkout code exists. The refund notice states that the current app is free and has no hidden fees. Progress copy is supportive and does not guarantee a body, strength, weight, or medical outcome. The avatar is expressly described as an illustration rather than a prediction.

## Consent and user control implemented

- Signup has separate, unticked controls for agreement to Terms and acknowledgement of the Privacy Notice, with direct links to all four policies. Acceptance version and timestamp are stored in Supabase user metadata.
- Onboarding has a separate, unticked explicit consent for body measurements and workout records. Its version and timestamp are stored in the user profile payload.
- Necessary mobile/browser storage is explained. No cookie banner is shown because no non-essential cookie, analytics, advertising, or tracking storage is active. Adding any such technology requires a prior opt-in control where applicable.
- Profile provides a data export through the platform share sheet and authenticated permanent account deletion.
- The authenticated `delete-account` Edge Function validates the caller, deletes only that caller's Auth user, and relies on cascading foreign keys to delete profile, routine, old web workout, and mobile workout rows. Local rows and tokens are then removed.
- A standalone `/delete-account.html` resource gives store-review and users a web path to the deletion flow.

## Security findings

- RLS is enabled on all four public tables. Policies restrict reads and writes to `auth.uid() = user_id`. Anonymous table privileges are revoked.
- Payload type/size, date, age, status, numeric range, and ownership constraints are present. The live mobile schema was applied during this audit.
- Account deletion requires an authenticated JWT; the service-role secret exists only inside the Edge Function environment.
- Mobile tokens use `expo-secure-store`; client code contains only a publishable Supabase key.
- Signup UI requires 12 characters with upper-case, lower-case, and a number. Server-side live Auth strength settings must still be aligned in the Supabase dashboard.
- **Open warning:** Supabase's advisor reports leaked-password protection disabled. Supabase documents this as a Pro-plan feature. Upgrade/enable it or record a written risk acceptance before release: <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>.
- **Open warning:** CAPTCHA was removed at the user's request. Keep strict Supabase rate limits, monitor abuse, and reassess privacy-preserving bot protection if signup abuse occurs.
- **Open warning:** The deliberately explicit “email already has an account” message permits account enumeration. This was a prior product requirement; a security review should decide whether to replace it with a generic response before public launch.
- Create and test a breach-response playbook. The US FTC Health Breach Notification Rule may apply if the product gains the technical capacity to combine identifiable health information from multiple sources: <https://www.ftc.gov/business-guidance/resources/health-breach-notification-rule-basics-business>.

## Accessibility audit

Implemented controls include labelled form inputs; link, button, radio, checkbox, and adjustable roles; announced form errors; decorative-image exclusion; meaningful avatar text; reduced-motion behaviour; visible web focus outlines; keyboard-native buttons/links; and colour pairs above WCAG AA text contrast (primary 17.96:1, muted 7.92:1, lime 16.79:1, coral 7.75:1 against the main background).

Manual release testing remains required with current iOS VoiceOver, Android TalkBack, hardware keyboard and switch control, 200% text/Dynamic Type, zoom/reflow on the web build, reduced motion, high contrast, and colour-vision simulations. Test every workout field, slider, tab, routine selector, policy link, export action, and deletion confirmation. WCAG 2.2 requires text alternatives, keyboard access, no keyboard trap, and adequate contrast: <https://www.w3.org/TR/WCAG22/>.

## Laws and platform rules likely relevant

Applicability depends on publisher location, user location, marketing, scale, and future features.

- **United Kingdom:** UK GDPR and Data Protection Act 2018 for personal and health data; PECR for cookies and similar device storage; Consumer Rights Act 2015 and Consumer Contracts Regulations 2013 for digital content and future payments; unfair-commercial-practice rules; Equality Act 2010 accessibility duties. ICO guidance treats health information as special-category data and requires an Article 9 condition: <https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/>.
- **European Economic Area:** GDPR, national ePrivacy implementation, consumer-contract/unfair-practices rules, and accessibility requirements where the service falls within scope. A processor agreement and valid transfer safeguards/subprocessor review are needed even though the main database region is Ireland.
- **United States:** FTC Act truthfulness/privacy promises; FTC Health Breach Notification Rule if its coverage test is met; state breach laws; Washington My Health My Data (broad health-data notice, consent, deletion, and no deceptive design); and state privacy laws such as California's CCPA/CPRA if statutory thresholds are met. Washington requires affirmative, specific consent and rejects consent buried in general terms: <https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true>.
- **Children:** The product is now 18+. Maintain neutral, non-child-directed marketing and promptly delete an under-age account. If minors are later allowed, reassess COPPA, the UK Children's Code, parental consent, age assurance, and youth-safety design before launch.
- **Health/medical:** The present feature set is general fitness logging and makes no diagnosis or treatment claim. Medical-device, professional-practice, or clinical-evidence duties may change if the app predicts injury, prescribes rehabilitation, treats disease, or makes medical efficacy claims.
- **App stores:** Apple requires in-app initiation of account deletion for apps with account creation. Google Play requires both an in-app path and a web deletion resource. Google also requires an accurate Health apps declaration and a public, non-geofenced privacy-policy URL for health/fitness apps: <https://developer.apple.com/support/offering-account-deletion-in-your-app>, <https://support.google.com/googleplay/android-developer/answer/13327111>, <https://support.google.com/googleplay/android-developer/answer/16679511>.

Before submission, complete Apple App Privacy labels, Google Play Data Safety, Google Health Apps declaration, content rating, encryption/export-compliance answers, and verified developer identity using the exact current build behaviour.

## Business, intellectual property, and licensing

- **Business identity:** configure the three `EXPO_PUBLIC_LEGAL_*` values, update the public static policy, ensure the store publisher and invoices use the same real entity, and check local company, tax, VAT, insurance, and consumer-contact requirements. The code cannot establish these facts.
- **Trade mark:** a preliminary official-web search is not clearance. “Full Body” is descriptive and crowded in fitness, which creates both conflict risk and weak exclusivity. Obtain a professional similarity search covering words, logos, app-store common-law use, domains, and relevant classes before spending on launch.
- **App copyright:** the prior `mobile/LICENSE` incorrectly carried Expo's copyright as though it licensed the app. It now identifies the app as proprietary and separates third-party rights. Confirm the real copyright owner and replace “Full Body” with that legal owner if different.
- **Dependencies:** the installed direct production packages report MIT licences except `lottie-react-native`, which reports Apache-2.0. Preserve complete licence texts, copyright notices, and any required notices in distributed builds. Generate a fresh full transitive SBOM/licence report for every release; the current direct-package review is not a permanent clearance.
- **Media:** retain prompts, generation receipts/terms, source files, and licence evidence for the generated athlete/background artwork and custom Lottie JSON. Optional Exercise Library GIFs are upstream MIT according to the source repository; bundle attribution and licence text if redistributed. Do not rely on a repository label alone if provenance of community-contributed media is uncertain.
- **Exercise text:** have a qualified fitness professional review safety and originality. Exercise names themselves are generally descriptive, but copied wording, photos, video, logos, or branded programmes can create copyright or trade-mark issues.

## Release checklist

- [ ] Supply and configure the real legal entity, address, privacy email, country, registration/tax details, and store support contact.
- [ ] Choose launch countries and obtain local legal review for privacy, health-data consent, terms, and consumer law.
- [ ] Sign/review Supabase's DPA and subprocessor/transfer terms; document retention and backup deletion periods.
- [ ] Complete a DPIA/health-data risk assessment, record of processing, rights-request procedure, retention schedule, and breach plan.
- [ ] Upgrade/enable leaked-password protection or formally accept the risk; align live server password policy with the client.
- [ ] Perform formal trade-mark clearance and confirm domains/store names.
- [ ] Confirm ownership/licences and ship required third-party notices/SBOM.
- [ ] Conduct manual accessibility testing on physical iOS and Android devices and the production web URL.
- [ ] Publish the privacy and deletion pages on stable public HTTPS URLs and enter them in both stores.
- [ ] Complete Apple privacy labels, Google Data Safety, Google Health declaration, age/content ratings, and developer identity.
- [ ] Test export and real account deletion with a disposable production-like account, including cascade deletion and token invalidation.
- [ ] Have final policies reviewed against the exact production build and business model immediately before release.
