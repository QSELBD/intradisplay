const clockElement = document.getElementById("clock");
const categoryElement = document.getElementById("news-category");
const titleElement = document.getElementById("news-title");
const textElement = document.getElementById("news-text");
const imageElement = document.getElementById("news-image");
const newsSection = document.querySelector(".news");

let newsList = [];
let currentNewsIndex = 0;
let slideshowTimer = null;

function updateClock() {
    if (!clockElement) {
        return;
    }

    const now = new Date();

    clockElement.textContent = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function displayNews(index) {
    const news = newsList[index];

    if (!news) {
        return;
    }

    categoryElement.textContent = news.categorie || "Information";
    titleElement.textContent = news.titre || "Actualité";
    textElement.textContent = news.texte || "";

    if (news.image) {
        imageElement.style.backgroundImage = `url("${news.image}")`;
    } else {
        imageElement.style.backgroundImage =
            "linear-gradient(135deg, #222 0%, #050505 100%)";
    }
}

function showNextNews() {
    if (newsList.length <= 1) {
        return;
    }

    newsSection.classList.add("is-changing");

    window.setTimeout(() => {
        currentNewsIndex = (currentNewsIndex + 1) % newsList.length;
        displayNews(currentNewsIndex);

        window.requestAnimationFrame(() => {
            newsSection.classList.remove("is-changing");
        });
    }, 700);
}

async function loadNews() {
    try {
        const response = await fetch("../data/news.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Impossible de charger les actualités.");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Aucune actualité disponible.");
        }

        newsList = data;
        currentNewsIndex = 0;

        displayNews(currentNewsIndex);

        if (slideshowTimer) {
            clearInterval(slideshowTimer);
        }

        slideshowTimer = setInterval(showNextNews, 10000);
    } catch (error) {
        categoryElement.textContent = "Erreur";
        titleElement.textContent = "Actualités indisponibles";
        textElement.textContent = error.message;
        imageElement.style.backgroundImage =
            "linear-gradient(135deg, #222 0%, #050505 100%)";
    }
}

updateClock();
setInterval(updateClock, 1000);

loadNews();