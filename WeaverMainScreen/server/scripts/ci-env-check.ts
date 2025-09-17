import 'dotenv/config';

const required = [
  'OPENAI_API_KEY',
  'GOOGLE_PROJECT_ID',
  'GOOGLE_LOCATION',
];

let ok = true;
for (const key of required) {
  if (!process.env[key]) { console.error(`Missing env: ${key}`); ok = false; }
}
if (!process.env.GEMINI_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Missing Google creds: set GEMINI_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
  ok = false;
}
if (!ok) process.exit(1);
console.log('Env check: OK');
