import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase Config provided by the user
const firebaseConfig = {
    apiKey: "AIzaSyCVzs-WmjMkftkZEv3hw36RJ-cj6pQIu1o",
    authDomain: "field-x-site.firebaseapp.com",
    projectId: "field-x-site",
    storageBucket: "field-x-site.firebasestorage.app",
    messagingSenderId: "599230323320",
    appId: "1:599230323320:web:b873d0d991ce10011d6b8d",
    measurementId: "G-1KJR7DHBBL"
};

// API Keys provided by the user
const OPENWEATHER_API_KEY = '9eed8f7ae89829b2eb18b1a839a4eb6c';
const NEWSDATA_API_KEY = 'pub_47ad1ecfd13f481fa37387aae63eec83';
const GOOGLE_MAPS_API_KEY = 'AIzaSyBqwVP4QQRPNvJQeISnXu63yribN0Ms1bQ';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUserId = null; // To store the current authenticated user's ID

// Global variables provided by the Canvas environment (if available)
const appIdFromCanvas = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.appId;
const initialAuthTokenFromCanvas = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Auth State Listener ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        // If the user is authenticated, show the dashboard and hide login/signup buttons
        document.querySelector('.login-btn').style.display = 'none';
        document.querySelector('.signup-btn').style.display = 'none';
        document.getElementById('signout-btn').style.display = 'block';
        navigateTo('dashboard');

        // Fetch user data from Firestore
        const userDocRef = doc(db, `artifacts/${appIdFromCanvas}/users/${user.uid}/fieldx_data/profile`);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            document.getElementById('welcome-message').textContent = `Olá ${userData.fullName || user.email.split('@')[0]}, seja bem-vindo de volta ao Field X!`;
            document.getElementById('last-login').textContent = `Último acesso: ${new Date(userData.lastLogin).toLocaleString('pt-BR')}`;
            document.getElementById('user-id').textContent = currentUserId; // Display user ID
            // Update last login timestamp
            await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
        } else {
            console.warn("User profile not found in Firestore for:", user.uid);
            document.getElementById('welcome-message').textContent = `Olá ${user.email.split('@')[0]}, seja bem-vindo de volta ao Field X!`;
            document.getElementById('last-login').textContent = `Último acesso: N/A`;
            document.getElementById('user-id').textContent = currentUserId; // Display user ID
        }
        fetchWeatherData(document.getElementById('location').textContent); // Fetch weather for default/current location
        fetchNewsData();
    } else {
        currentUserId = null;
        // If no user is authenticated, show the landing page and login/signup buttons
        document.querySelector('.login-btn').style.display = 'block';
        document.querySelector('.signup-btn').style.display = 'block';
        document.getElementById('signout-btn').style.display = 'none';
        navigateTo('home');

        // Attempt anonymous sign-in if no custom token is provided
        if (!initialAuthTokenFromCanvas) {
            try {
                await signInAnonymously(auth);
                console.log("Signed in anonymously.");
            } catch (error) {
                console.error("Error signing in anonymously:", error);
            }
        }
    }
});

// Sign in with custom token if available
if (initialAuthTokenFromCanvas) {
    signInWithCustomToken(auth, initialAuthTokenFromCanvas)
        .then(() => console.log("Signed in with custom token."))
        .catch(error => {
            console.error("Error signing in with custom token:", error);
            // Fallback to anonymous if custom token fails
            signInAnonymously(auth)
                .then(() => console.log("Signed in anonymously after token failure."))
                .catch(anonError => console.error("Error signing in anonymously:", anonError));
        });
} else if (!auth.currentUser) {
    // If no token and no current user, sign in anonymously
    signInAnonymously(auth)
        .then(() => console.log("Signed in anonymously."))
        .catch(error => console.error("Error signing in anonymously:", error));
}


// --- Navigation ---
window.navigateTo = (page) => {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('dashboard').classList.remove('active');
    if (page === 'home') {
        document.getElementById('landing-page').classList.add('active');
    } else if (page === 'dashboard') {
        document.getElementById('dashboard').classList.add('active');
    }
    // Close mobile menu if open
    document.getElementById('nav-menu').classList.remove('open');
};

window.toggleMenu = () => {
    document.getElementById('nav-menu').classList.toggle('open');
};

// --- Modal Logic ---
let currentAuthType = ''; // 'login' or 'signup'
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordField = document.getElementById('password-field');
const passwordInput = document.getElementById('password');
const signupFields = document.getElementById('signup-fields');
const fullNameInput = document.getElementById('fullName');
const cityStateInput = document.getElementById('cityState');
const phoneInput = document.getElementById('phone');
const planSelect = document.getElementById('plan');
const authSubmitBtn = document.getElementById('auth-submit');
const signupContinueBtn = document.getElementById('signup-continue');
const authError = document.getElementById('auth-error');

window.openModal = (type) => {
    currentAuthType = type;
    authError.textContent = ''; // Clear previous errors
    emailInput.value = ''; // Clear email
    passwordInput.value = ''; // Clear password
    fullNameInput.value = '';
    cityStateInput.value = '';
    phoneInput.value = '';
    planSelect.value = 'AgroX Base';

    if (type === 'login') {
        modalTitle.textContent = 'Entrar no Field X';
        passwordField.style.display = 'block';
        signupFields.style.display = 'none';
        authSubmitBtn.textContent = 'Entrar';
        authSubmitBtn.style.display = 'block';
        signupContinueBtn.style.display = 'none';
        emailInput.disabled = false;
    } else { // signup
        modalTitle.textContent = 'Criar Conta Field X';
        passwordField.style.display = 'none'; // Hide password initially for email step
        signupFields.style.display = 'none';
        authSubmitBtn.style.display = 'none';
        signupContinueBtn.style.display = 'block';
        emailInput.disabled = false;
    }
    modal.classList.add('open');
};

window.closeModal = () => {
    modal.classList.remove('open');
};

signupContinueBtn.addEventListener('click', () => {
    if (emailInput.value) {
        emailInput.disabled = true; // Disable email after first step
        passwordField.style.display = 'block';
        signupFields.style.display = 'block';
        authSubmitBtn.style.display = 'block';
        authSubmitBtn.textContent = 'Criar Conta e Pagar (Simulado)';
        signupContinueBtn.style.display = 'none';
    } else {
        authError.textContent = 'Por favor, insira seu email.';
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = ''; // Clear previous errors
    const email = emailInput.value;
    const password = passwordInput.value;

    if (currentAuthType === 'login') {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeModal();
        } catch (error) {
            authError.textContent = 'Erro ao fazer login: ' + error.message;
            console.error("Login error:", error);
        }
    } else { // signup
        const fullName = fullNameInput.value;
        const cityState = cityStateInput.value;
        const phone = phoneInput.value;
        const selectedPlan = planSelect.value;

        if (!fullName || !cityState || !password) {
            authError.textContent = 'Por favor, preencha todos os campos obrigatórios.';
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, `artifacts/${appIdFromCanvas}/users/${user.uid}/fieldx_data/profile`);
            await setDoc(userDocRef, {
                fullName,
                cityState,
                phone,
                selectedPlan,
                email: user.email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            });
            closeModal();
        } catch (error) {
            authError.textContent = 'Erro ao criar conta: ' + error.message;
            console.error("Signup error:", error);
        }
    }
});

window.signOutUser = async () => {
    try {
        await signOut(auth);
        console.log("User signed out.");
        navigateTo('home');
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// --- Dashboard Specific Functions ---
const weatherCurrentDiv = document.getElementById('weather-current');
const weatherForecastDiv = document.getElementById('weather-forecast');
const newsDiv = document.getElementById('news');
const locationSpan = document.getElementById('location');
const locationInputDiv = document.getElementById('location-input');
const newLocationInput = document.getElementById('new-location');
const offlineWarning = document.getElementById('offline-warning');
const calculationsDiv = document.getElementById('calculations');

// Mock past calculations for demonstration
const pastCalculations = [
    { id: 1, date: '15/05/2024', crop: 'Soja - Safra 2023/2024', cost: 'R$ 3.500/ha', profit: 'R$ 1.200/ha' },
    { id: 2, date: '20/11/2023', crop: 'Milho - Safra 2023/2024', cost: 'R$ 2.800/ha', profit: 'R$ 900/ha' },
    { id: 3, date: '10/06/2023', crop: 'Algodão - Safra 2022/2023', cost: 'R$ 4.200/ha', profit: 'R$ 1.500/ha' },
];

// Function to render past calculations
const renderPastCalculations = () => {
    calculationsDiv.innerHTML = ''; // Clear previous content
    if (pastCalculations.length > 0) {
        pastCalculations.forEach(calc => {
            const calcItem = document.createElement('div');
            calcItem.className = 'calculation-item';
            calcItem.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-900">${calc.crop}</p>
                    <p class="text-sm text-gray-600">Data: ${calc.date}</p>
                    <p class="text-sm text-gray-600">Custo/ha: ${calc.cost}</p>
                    <p class="text-sm text-gray-600">Lucro Previsto: ${calc.profit}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="redo-btn">Refazer</button>
                    <button class="export-btn">Exportar</button>
                </div>
            `;
            calculationsDiv.appendChild(calcItem);
        });
    } else {
        calculationsDiv.textContent = 'Nenhum cálculo realizado ainda.';
    }
};

// Call render on load
renderPastCalculations();


window.getWeatherIconHtml = (iconCode) => {
    // Map OpenWeatherMap icons to simple emojis
    switch (iconCode) {
        case '01d': return '<span class="icon" style="color: #f59e0b;">☀️</span>'; // Sun
        case '01n': return '<span class="icon">🌙</span>'; // Moon
        case '02d':
        case '02n': return '<span class="icon" style="color: #9ca3af;">⛅</span>'; // Cloud with sun/moon
        case '03d':
        case '03n':
        case '04d':
        case '04n': return '<span class="icon" style="color: #6b7280;">☁️</span>'; // Cloud
        case '09d':
        case '09n': return '<span class="icon" style="color: #3b82f6;">🌧️</span>'; // Rain
        case '10d':
        case '10n': return '<span class="icon" style="color: #3b82f6;">🌦️</span>'; // Rain and sun
        case '11d':
        case '11n': return '<span class="icon" style="color: #ef4444;">⛈️</span>'; // Thunderstorm
        case '13d':
        case '13n': return '<span class="icon" style="color: #bfdbfe;">❄️</span>'; // Snow
        case '50d':
        case '50n': return '<span class="icon" style="color: #9ca3af;">🌫️</span>'; // Mist
        default: return '<span class="icon">❓</span>';
    }
};

window.fetchWeatherData = async (loc) => {
    if (!OPENWEATHER_API_KEY) {
        console.warn("OpenWeatherMap API Key not set. Weather data will be mocked.");
        weatherCurrentDiv.innerHTML = `
            <div class="weather-current">
                <span class="icon" style="color: #f59e0b;">☀️</span>
                <div>
                    <p class="temp">28°C</p>
                    <p>Céu limpo</p>
                </div>
            </div>
        `;
        weatherForecastDiv.innerHTML = `
            <div><p>Amanhã</p><span class="icon" style="color: #f59e0b;">☀️</span><p>29°C</p><p>Ensolarado</p></div>
            <div><p>Dom</p><span class="icon" style="color: #9ca3af;">⛅</span><p>27°C</p><p>Parcialmente nublado</p></div>
            <div><p>Seg</p><span class="icon" style="color: #f59e0b;">☀️</span><p>30°C</p><p>Quente</p></div>
            <div><p>Ter</p><span class="icon" style="color: #3b82f6;">🌧️</span><p>26°C</p><p>Chuva leve</p></div>
            <div><p>Qua</p><span class="icon" style="color: #6b7280;">☁️</span><p>28°C</p><p>Nublado</p></div>
        `;
        return;
    }

    try {
        const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${loc}&limit=1&appid=${OPENWEATHER_API_KEY}`);
        const geoData = await geoResponse.json();

        if (geoData.length > 0) {
            const { lat, lon } = geoData[0];
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&lang=pt_br&appid=${OPENWEATHER_API_KEY}`);
            const weatherData = await weatherResponse.json();

            // Current weather
            weatherCurrentDiv.innerHTML = `
                <div class="weather-current">
                    ${getWeatherIconHtml(weatherData.current.weather[0].icon)}
                    <div>
                        <p class="temp">${Math.round(weatherData.current.temp)}°C</p>
                        <p>${weatherData.current.weather[0].description.charAt(0).toUpperCase() + weatherData.current.weather[0].description.slice(1)}</p>
                    </div>
                </div>
            `;

            // 5-day forecast
            let forecastHtml = '';
            weatherData.daily.slice(1, 6).forEach(day => {
                const date = new Date(day.dt * 1000);
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                forecastHtml += `
                    <div>
                        <p>${dayName}</p>
                        ${getWeatherIconHtml(day.weather[0].icon)}
                        <p class="temp">${Math.round(day.temp.day)}°C</p>
                        <p>${day.weather[0].description.charAt(0).toUpperCase() + day.weather[0].description.slice(1)}</p>
                    </div>
                `;
            });
            weatherForecastDiv.innerHTML = forecastHtml;
        } else {
            weatherCurrentDiv.innerHTML = '<p>Localização não encontrada para o clima.</p>';
            weatherForecastDiv.innerHTML = '';
        }
    } catch (error) {
        console.error("Erro ao buscar dados do clima:", error);
        weatherCurrentDiv.innerHTML = '<p>Erro ao carregar dados do clima.</p>';
        weatherForecastDiv.innerHTML = '';
    }
};

window.fetchNewsData = async () => {
    if (!NEWSDATA_API_KEY) {
        console.warn("NewsData.io API Key not set. News data will be mocked.");
        newsDiv.innerHTML = `
            <div class="news-item">
                <h4>Preços da soja em alta no mercado internacional</h4>
                <p>Analistas preveem valorização contínua devido à demanda global.</p>
                <a href="#">Leia mais</a>
            </div>
            <div class="news-item">
                <h4>Nova tecnologia de irrigação promete economia de água</h4>
                <p>Sistema inteligente otimiza o uso de recursos hídricos nas lavouras.</p>
                <a href="#">Leia mais</a>
            </div>
            <div class="news-item">
                <h4>Desafios e oportunidades para o agronegócio em 2025</h4>
                <p>Especialistas discutem o cenário econômico e as tendências do setor.</p>
                <a href="#">Leia mais</a>
            </div>
        `;
        return;
    }
    try {
        const response = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&language=pt&q=agronegocio`);
        const data = await response.json();
        if (data.results) {
            let newsHtml = '';
            data.results.slice(0, 5).forEach(item => {
                newsHtml += `
                    <div class="news-item">
                        <h4>${item.title}</h4>
                        <p>${item.description || 'Sem descrição.'}</p>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer">Leia mais</a>
                    </div>
                `;
            });
            newsDiv.innerHTML = newsHtml;
        }
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        newsDiv.innerHTML = '<p>Erro ao carregar notícias.</p>';
    }
};

window.toggleLocationInput = () => {
    if (locationInputDiv.style.display === 'none') {
        locationInputDiv.style.display = 'flex';
        document.getElementById('location-toggle').textContent = 'Cancelar';
    } else {
        locationInputDiv.style.display = 'none';
        document.getElementById('location-toggle').textContent = 'Alterar';
        newLocationInput.value = ''; // Clear input on cancel
    }
};

window.changeLocation = () => {
    const newLoc = newLocationInput.value.trim();
    if (newLoc) {
        locationSpan.textContent = newLoc;
        fetchWeatherData(newLoc);
        toggleLocationInput(); // Hide input after setting
    }
};

// Offline detection
window.addEventListener('online', () => {
    offlineWarning.style.display = 'none';
    console.log("Online: Sincronizando dados...");
    // Trigger data sync here
});
window.addEventListener('offline', () => {
    offlineWarning.style.display = 'flex';
    console.log("Offline: Operando com dados locais.");
    // Load data from IndexedDB/localStorage here (mocked for now)
});

// Initial check for offline status
if (!navigator.onLine) {
    offlineWarning.style.display = 'flex';
}

// Google Maps Initialization (Placeholder)
window.initMap = () => {
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        const ipora = { lat: -17.7111, lng: -50.0883 }; // Coordinates for Iporá, Goiás
        const map = new google.maps.Map(mapDiv, {
            zoom: 10,
            center: ipora,
        });
        new google.maps.Marker({
            position: ipora,
            map: map,
            title: 'Sua Fazenda em Iporá',
        });
    }
};

// Ensure initMap is called if Google Maps script loads later
if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
    initMap();
} else {
    window.addEventListener('load', () => {
        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
            initMap();
        }
    });
}
