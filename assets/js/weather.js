const WEATHER_LATITUDE = 45.2561;
const WEATHER_LONGITUDE = 5.6658;
const WEATHER_REFRESH_DELAY = 15 * 60 * 1000;

const currentDateElement =
    document.getElementById("current-date");

const weatherIconElement =
    document.getElementById("weather-icon");

const weatherTemperatureElement =
    document.getElementById("weather-temperature");

const weatherDescriptionElement =
    document.getElementById("weather-description");

function updateCurrentDate() {
    if (!currentDateElement) {
        return;
    }

    const now = new Date();

    currentDateElement.textContent =
        now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
}

async function loadWeather() {
    try {
        const weatherUrl =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${WEATHER_LATITUDE}` +
            `&longitude=${WEATHER_LONGITUDE}` +
            "&current=temperature_2m,weather_code" +
            "&temperature_unit=celsius" +
            "&timezone=Europe%2FParis";

        const response = await fetch(weatherUrl);

        if (!response.ok) {
            throw new Error(
                "Le service météo ne répond pas."
            );
        }

        const data = await response.json();
        const currentWeather = data.current;

        if (!currentWeather) {
            throw new Error(
                "Les données météo sont absentes."
            );
        }

        const temperature =
            Math.round(currentWeather.temperature_2m);

        const weatherInformation =
            getWeatherInformation(
                currentWeather.weather_code
            );

        weatherIconElement.textContent =
            weatherInformation.icon;

        weatherTemperatureElement.textContent =
            `${temperature} °C`;

        weatherDescriptionElement.textContent =
            `${weatherInformation.label} · Fontanil-Cornillon`;
    } catch (error) {
        console.error(
            "Erreur pendant le chargement météo :",
            error
        );

        weatherIconElement.textContent = "⚠";

        weatherTemperatureElement.textContent =
            "-- °C";

        weatherDescriptionElement.textContent =
            "Météo indisponible · Fontanil-Cornillon";
    }
}

function getWeatherInformation(weatherCode) {
    const weatherMap = {
        0: {
            icon: "☀",
            label: "Ciel dégagé"
        },
        1: {
            icon: "🌤",
            label: "Peu nuageux"
        },
        2: {
            icon: "⛅",
            label: "Partiellement nuageux"
        },
        3: {
            icon: "☁",
            label: "Couvert"
        },
        45: {
            icon: "🌫",
            label: "Brouillard"
        },
        48: {
            icon: "🌫",
            label: "Brouillard givrant"
        },
        51: {
            icon: "🌦",
            label: "Bruine légère"
        },
        53: {
            icon: "🌦",
            label: "Bruine"
        },
        55: {
            icon: "🌧",
            label: "Bruine forte"
        },
        61: {
            icon: "🌦",
            label: "Pluie légère"
        },
        63: {
            icon: "🌧",
            label: "Pluie"
        },
        65: {
            icon: "🌧",
            label: "Pluie forte"
        },
        71: {
            icon: "🌨",
            label: "Neige légère"
        },
        73: {
            icon: "🌨",
            label: "Neige"
        },
        75: {
            icon: "❄",
            label: "Neige forte"
        },
        80: {
            icon: "🌦",
            label: "Averses légères"
        },
        81: {
            icon: "🌧",
            label: "Averses"
        },
        82: {
            icon: "⛈",
            label: "Fortes averses"
        },
        95: {
            icon: "⛈",
            label: "Orage"
        },
        96: {
            icon: "⛈",
            label: "Orage avec grêle"
        },
        99: {
            icon: "⛈",
            label: "Orage violent"
        }
    };

    return weatherMap[weatherCode] || {
        icon: "🌡",
        label: "Conditions météo"
    };
}

function startDateAndWeather() {
    updateCurrentDate();
    loadWeather();

    /*
     * Actualisation de la date chaque minute.
     */
    setInterval(
        updateCurrentDate,
        60 * 1000
    );

    /*
     * Actualisation météo toutes les 15 minutes.
     */
    setInterval(
        loadWeather,
        WEATHER_REFRESH_DELAY
    );
}