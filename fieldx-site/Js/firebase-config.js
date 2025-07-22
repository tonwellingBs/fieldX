// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCVzs-WmjMkftkZEv3hw36RJ-cj6pQIu1o",
  authDomain: "field-x-site.firebaseapp.com",
  projectId: "field-x-site",
  storageBucket: "field-x-site.appspot.com",
  messagingSenderId: "599230323320",
  appId: "1:599230323320:web:b873d0d991ce10011d6b8d",
  measurementId: "G-1KJR7DHBBL"
};

// Inicialização do Firebase
firebase.initializeApp(firebaseConfig);

// Exportação dos serviços
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Habilita persistência offline
db.enablePersistence()
  .catch(err => {
    console.error("Erro na persistência:", err.code);
  });

export { auth, db, storage };