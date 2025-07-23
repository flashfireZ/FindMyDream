// firebase-init.js

// Importez simplement les fichiers. Cela les exécute et crée l'objet global 'firebase'.
import "./libs/firebase-app-compat.js";
import "./libs/firebase-auth-compat.js";
import "./libs/firebase-firestore-compat.js";

// La configuration ne change pas
const firebaseConfig = {
  apiKey: "AIzaSyCLuNKgqNGrsKxO8IqJYeITEOsZtGb3gss",
  authDomain: "found-my-dream.firebaseapp.com",
  projectId: "found-my-dream",
  storageBucket: "found-my-dream.appspot.com",
  messagingSenderId: "487127636268",
  appId: "1:487127636268:web:2f545b252cd89c2c00f489"
};

// Initialisez l'application en utilisant l'objet global 'firebase'
const app = firebase.initializeApp(firebaseConfig);

// Obtenez les services depuis l'objet global
const auth = firebase.auth();
const db = firebase.firestore();

// Exportez-les pour que popup.js puisse les utiliser
export { auth, db };