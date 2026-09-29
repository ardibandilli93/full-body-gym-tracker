const required = [
  'EXPO_PUBLIC_LEGAL_NAME',
  'EXPO_PUBLIC_PRIVACY_EMAIL',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Release blocked: configure ${missing.join(', ')}.`);
  process.exit(1);
}

console.log('Public developer identity and privacy email are configured. Complete the app-store identity checks and manual release checklist in docs/COMPLIANCE_AUDIT.md.');
