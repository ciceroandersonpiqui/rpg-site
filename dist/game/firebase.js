import { initializeApp } from "firebase/app";
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  onDisconnect, 
  serverTimestamp, 
  get, 
  push   // ✅ agora incluído
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBjJEctFKWCQxISLcNmPBYLGIzAxAOWybk",
  authDomain: "dadosrpg-d9d36.firebaseapp.com",
  databaseURL: "https://dadosrpg-d9d36-default-rtdb.firebaseio.com",
  projectId: "dadosrpg-d9d36",
  storageBucket: "dadosrpg-d9d36.firebasestorage.app",
  messagingSenderId: "682190780414",
  appId: "1:682190780414:web:051acadf34218713e6f2af",
  measurementId: "G-WFV0V6SB7Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, set, update, onDisconnect, serverTimestamp, get, push };

