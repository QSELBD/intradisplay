let news = [];
let currentNewsIndex = 0;
let slideshowTimer = null;

const SLIDE_DURATION = 10000;
const STORAGE_KEY = "gam-display-news";

const newsVisual = document.getElementById("news-image");
const newsCategory = document.getElementById("news-category");
const newsTitle = document.getElementById("news-title");
const newsText = document.getElementById("news-text");
const newsPagination = document.getElementById("news-pagination");

async function loadNews() {
    try {
        const savedNews = localStorage.getItem(STORAGE_KEY);

        if (savedNews) {
            news = JSON.parse(savedNews);
        } else {
            const response = await fetch("../data/news.json");

            if (!response.ok) {
                throw new Error(
                    "Impossible de charger le fichier news.json"
                );
            }

            news = await response.json();
        }

        if (!Array.isArray(news) || news.length === 0) {
            throw new Error("Aucune actualité disponible");
        }

        currentNewsIndex = 0;
        
        stopSlideshow();
        createPagination();
        displayNews(currentNewsIndex);
        startSlideshow();
    } catch (error) {
        console.error(error);

        newsCategory.textContent = "Erreur";
        newsTitle.textContent = "Actualités indisponibles";
        newsText.textContent =
            "Les actualités n’ont pas pu être chargées.";

        newsVisual.style.setProperty(
            "--news-image",
            "none"
        );
    }
}

function getImageUrl(image) {
    if (!image) {
        return "";
    }

    if (
        image.startsWith("data:") ||
        image.startsWith("blob:")
    ) {
        return image;
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    /*
     * Ancien format du JSON :
     * "../assets/images/actu1.jpg"
     */
    if (image.startsWith("../assets/images/")) {
        return new URL(
            image,
            window.location.href
        ).href;
    }

    /*
     * Nouveau format recommandé :
     * "actu1.jpg"
     */
    return new URL(
        `../assets/images/${image}`,
        window.location.href
    ).href;
}

function displayNews(index) {
    const currentNews = news[index];

    if (!currentNews) {
        return;
    }

    const category =
        currentNews.category ||
        currentNews.categorie ||
        currentNews.type ||
        "Actualité";

    const title =
        currentNews.title ||
        currentNews.titre ||
        "Sans titre";

    const text =
        currentNews.text ||
        currentNews.texte ||
        currentNews.description ||
        "";

    const image =
        currentNews.image ||
        currentNews.photo ||
        "";

    newsCategory.textContent = category;
    newsTitle.textContent = title;
    newsText.textContent = text;

    const imageUrl = getImageUrl(image);

    if (imageUrl) {
        newsVisual.style.setProperty(
            "--news-image",
            `url("${imageUrl}")`
        );
    } else {
        newsVisual.style.setProperty(
            "--news-image",
            "none"
        );
    }

    restartKenBurns();
    updatePagination();
}

function restartKenBurns() {
    newsVisual.classList.remove("ken-burns");

    void newsVisual.offsetWidth;

    newsVisual.classList.add("ken-burns");
}

function showNextNews() {
    if (news.length <= 1) {
        return;
    }

    fadeOut(newsVisual);

    setTimeout(() => {
        currentNewsIndex =
            (currentNewsIndex + 1) % news.length;

        displayNews(currentNewsIndex);
        fadeIn(newsVisual);
    }, 500);
}

function showNews(index) {
    if (
        index === currentNewsIndex ||
        !news[index]
    ) {
        return;
    }

    fadeOut(newsVisual);

    setTimeout(() => {
        currentNewsIndex = index;

        displayNews(currentNewsIndex);
        fadeIn(newsVisual);
        startSlideshow();
    }, 500);
}

function startSlideshow() {
    stopSlideshow();

    if (news.length <= 1) {
        return;
    }

    slideshowTimer = setInterval(
        showNextNews,
        SLIDE_DURATION
    );
}

function stopSlideshow() {
    if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }
}

function createPagination() {
    newsPagination.innerHTML = "";

    news.forEach((item, index) => {
        const dot = document.createElement("button");

        dot.className = "news-dot";
        dot.type = "button";

        dot.setAttribute(
            "aria-label",
            `Afficher l’actualité ${index + 1}`
        );

        dot.addEventListener("click", () => {
            showNews(index);
        });

        newsPagination.appendChild(dot);
    });
}

function updatePagination() {
    const dots =
        newsPagination.querySelectorAll(".news-dot");

    dots.forEach((dot, index) => {
        dot.classList.toggle(
            "active",
            index === currentNewsIndex
        );
    });
window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) {
        return;
    }

    stopSlideshow();
    loadNews();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        stopSlideshow();
        loadNews();
    }
});
}