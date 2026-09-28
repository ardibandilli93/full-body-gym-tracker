const required = [
  'EXPO_PUBLIC_LEGAL_NAME',
  'EXPO_PUBLIC_PRIVACY_EMAIL',
  'EXPO_PUBLIC_LEGAL_ADDRESS',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Release blocked: configure ${missing.join(', ')}.`);
  process.exit(1);
}

console.log('Legal identity fields are configured. Complete the manual release checklist in docs/COMPLIANCE_AUDIT.md.');
