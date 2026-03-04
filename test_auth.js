import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile(new URL('./serviceAccountKey.json', import.meta.url)));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function checkUser(email) {
    try {
        const userRecord = await auth.getUserByEmail(email);
        console.log(`User found: ${userRecord.uid}`);
        console.log(`Email Verified: ${userRecord.emailVerified}`);
        console.log(`Custom Claims:`, userRecord.customClaims);
    } catch (error) {
        console.error('Error fetching user data:', error.message);
    }
}

checkUser('lucas.lima@sou.ufac.br');
