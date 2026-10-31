import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { environment } from '../../../environments/environment';

// Inicializa o Firebase com as configs do environment
export const firebaseApp  = initializeApp(environment.firebase);
export const firestore    = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);
