import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5TdSQm-3I53N72IT6MH8aLjYB0lwBE10",
  authDomain: "public-test-9c798.firebaseapp.com",
  projectId: "public-test-9c798",
  storageBucket: "public-test-9c798.firebasestorage.app",
  messagingSenderId: "775147567928",
  appId: "1:775147567928:web:4c001fe4c1f0432a121fcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = "notes";

// Save a note to Firestore
export async function saveNote(text) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      text: text,
      createdAt: serverTimestamp()
    });
    console.log("Note saved with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving note:", error);
    throw error;
  }
}

// Retrieve all notes from Firestore (ordered by creation time)
export async function getNotes() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return notes;
  } catch (error) {
    console.error("Error getting notes:", error);
    throw error;
  }
}

// Retrieve a single note by ID
export async function getNote(noteId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, noteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting note:", error);
    throw error;
  }
}

export { db };
