const OPENWEATHER_API_KEY = '9eed8f7ae89829b2eb18b1a839a4eb6c';
const GOOGLE_MAPS_API_KEY = 'AIzaSyBqwVP4QQRPNvJQeISnXu63yribN0Ms1bQ';
const currentDate = new Date('2025-07-21T16:39:00-03:00');

function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -15.7942, lng: -47.8825 },
        zoom: 8,
    });
    if (document.getElementById("monitoring-map")) {
        new google.maps.Map(document.getElementById("monitoring-map"), {
            center: { lat: -15.7942, lng: -47.8825 },
            zoom: 10,
        });
    }
}

async function fetchWeatherData() {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=-15.7942&lon=-47.8825&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const data = await response.json();
    return data.list.slice(0, 5).map(day => ({
        date: new Date(day.dt * 1000).toLocaleDateString(),
        temp: Math.round(day.main.temp),
        desc: day.weather[0].description,
    }));
}

function displayWeather(data) {
    const output = document.getElementById('weather-output');
    output.innerHTML = data.map(d => `<p>${d.date}: ${d.temp}°C, ${d.desc}</p>`).join('');
}

function renderProductivityChart() {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2023', '2024', '2025'],
            datasets: [{
                label: 'Produtividade (ton/ha)',
                data: [2.5, 3.0, 3.5],
                backgroundColor: 'rgba(76, 175, 80, 0.6)',
            }],
        },
        options: { scales: { y: { beginAtZero: true } } },
    });
}

function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Fazenda A', 'Fazenda B', 'Fazenda C'],
            datasets: [{
                label: 'Produtividade (ton/ha)',
                data: [3.0, 2.8, 3.2],
                borderColor: 'rgba(76, 175, 80, 1)',
                fill: false,
            }],
        },
        options: { scales: { y: { beginAtZero: true } } },
    });
}

function simulateSoilAnalysis(lat = -15.7942, lon = -47.8825) {
    const soilTypes = ['Argiloso', 'Arenoso', 'Misto'];
    const randomSoil = soilTypes[Math.floor(Math.random() * soilTypes.length)];
    return {
        type: randomSoil,
        nitrogen: Math.floor(Math.random() * 20) + 10,
        cost: Math.floor(Math.random() * 500) + 200,
    };
}

function checkAlerts() {
    const alerts = document.getElementById('alerts');
    if (new Date() > new Date('2025-07-20')) {
        alerts.textContent = 'Atenção: Colheita pendente!';
    }
}

function displayRecommendations() {
    const recs = ['Adubação recomendada para soja.', 'Irrigação necessária em 2 dias.', 'Colheita prevista para 25/07/2025.'];
    document.getElementById('recommendations-output').textContent = recs.join('\n');
}

function calculateRule3() {
    const val1 = parseFloat(document.getElementById('rule3-val1').value);
    const val2 = parseFloat(document.getElementById('rule3-val2').value);
    const result = parseFloat(document.getElementById('rule3-result').value);
    if (val1 && val2 && result) {
        const x = (result * val2) / val1;
        document.getElementById('rule3-output').textContent = `Resultado: ${x.toFixed(2)} kg/mL`;
    } else {
        document.getElementById('rule3-output').textContent = 'Preencha todos os campos.';
    }
}

function calculateNitrogen() {
    const percentage = parseFloat(document.getElementById('n-percentage').value);
    const needed = parseFloat(document.getElementById('n-needed').value);
    const density = parseFloat(document.getElementById('n-density').value) || 1;
    if (percentage && needed) {
        const dose = (needed * 100) / (percentage * density);
        document.getElementById('n-output').textContent = `Dose: ${dose.toFixed(2)} L/ha`;
    } else {
        document.getElementById('n-output').textContent = 'Preencha % de N e N necessário.';
    }
}

function calculateProduction() {
    const area = parseFloat(document.getElementById('prod-area').value);
    const yield = parseFloat(document.getElementById('prod-yield').value);
    if (area && yield) {
        const total = area * yield;
        document.getElementById('prod-output').textContent = `Total: ${total.toFixed(2)} sacas`;
    } else {
        document.getElementById('prod-output').textContent = 'Preencha área e rendimento.';
    }
}

function calculateEconomy() {
    const cost = parseFloat(document.getElementById('econ-cost').value);
    const area = parseFloat(document.getElementById('econ-area').value);
    if (cost && area) {
        const total = cost * area;
        document.getElementById('econ-output').textContent = `Custo Total: R$ ${total.toFixed(2)}`;
    } else {
        document.getElementById('econ-output').textContent = 'Preencha custo e área.';
    }
}

function loadRequests() {
    const requests = [
        { producer: 'João', date: '20/07/2025', status: 'Pendente' },
        { producer: 'Maria', date: '19/07/2025', status: 'Concluído' },
    ];
    const list = document.getElementById('requests-list');
    list.innerHTML = requests.map(r => `<li>${r.producer} - ${r.date} (${r.status})</li>`).join('');
}