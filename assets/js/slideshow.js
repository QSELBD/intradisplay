let news = [];
let displayNewsList = [];
let currentNewsIndex = 0;
let slideshowTimer = null;

const DEFAULT_SLIDE_DURATION = 10000;
const MIN_SLIDE_DURATION = 3000;
const STORAGE_KEY = "gam-display-news";

const newsVisual =
    document.getElementById("news-image");

const newsCategory =
    document.getElementById("news-category");

const newsTitle =
    document.getElementById("news-title");

const newsText =
    document.getElementById("news-text");

const newsPagination =
    document.getElementById("news-pagination");

const newsQrCodeWrapper =
    document.getElementById(
        "news-qrcode-wrapper"
    );

const newsQrCode =
    document.getElementById(
        "news-qrcode"
    );

async function loadNews() {
    try {
        const savedNews =
            localStorage.getItem(STORAGE_KEY);

        if (savedNews) {
            news = JSON.parse(savedNews);
        } else {
            const response =
                await fetch("../data/news.json");

            if (!response.ok) {
                throw new Error(
                    "Impossible de charger le fichier news.json"
                );
            }

            news = await response.json();
        }

        if (
            !Array.isArray(news) ||
            news.length === 0
        ) {
            throw new Error(
                "Aucune actualité disponible"
            );
        }

        /*
         * Création du cycle de diffusion.
         * Une actualité prioritaire apparaît
         * une deuxième fois.
         */
        displayNewsList =
            createPriorityNewsList(news);

        currentNewsIndex = 0;

        stopSlideshow();
        createPagination();
        displayNews(currentNewsIndex);
        scheduleNextNews();
    } catch (error) {
        console.error(error);

        newsCategory.textContent =
            "Erreur";

        newsTitle.textContent =
            "Actualités indisponibles";

        newsText.textContent =
            "Les actualités n’ont pas pu être chargées.";

        newsVisual.style.setProperty(
            "--news-image",
            "none"
        );
    }
}

function createPriorityNewsList(newsItems) {
    const priorityItems = newsItems.filter(
        (item) => isPriorityNews(item)
    );

    const normalItems = newsItems.filter(
        (item) => !isPriorityNews(item)
    );

    return [
        ...priorityItems,
        ...normalItems
    ];
}

function isPriorityNews(item) {
    return (
        item.prioritaire === true ||
        item.priority === true ||
        item.prioritaire === "true" ||
        item.priority === "true"
    );
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

    if (
        image.startsWith(
            "../assets/images/"
        )
    ) {
        return new URL(
            image,
            window.location.href
        ).href;
    }

    return new URL(
        `../assets/images/${image}`,
        window.location.href
    ).href;
}

function getSlideDuration(item) {
    const durationInSeconds =
        Number(
            item.duree ??
            item.duration
        );

    if (
        !Number.isFinite(durationInSeconds) ||
        durationInSeconds <= 0
    ) {
        return DEFAULT_SLIDE_DURATION;
    }

    return Math.max(
        durationInSeconds * 1000,
        MIN_SLIDE_DURATION
    );
}

function displayNews(index) {
    const currentNews =
        displayNewsList[index];

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

    const qrCodeUrl =
    currentNews.qrCode ||
    currentNews.qrcode ||
    currentNews.qr_code ||
    "";

    newsCategory.textContent =
        category;

    newsTitle.textContent =
        title;

    newsText.textContent =
        text;

    const imageUrl =
        getImageUrl(image);

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

    displayQrCode(qrCodeUrl);

    restartKenBurns();
    updatePagination();
}

function displayQrCode(url) {
    if (
        !newsQrCodeWrapper ||
        !newsQrCode
    ) {
        return;
    }

    newsQrCode.innerHTML = "";

    if (!isValidQrCodeUrl(url)) {
        newsQrCodeWrapper.hidden = true;
        newsVisual.classList.remove(
            "has-qrcode"
);
        return;
    }

    if (typeof QRCode === "undefined") {
        console.error(
            "La bibliothèque QRCode n’est pas chargée."
        );

        newsQrCodeWrapper.hidden = true;
        return;
    }

    newsQrCodeWrapper.hidden = false;

    newsVisual.classList.add(
    "has-qrcode"
    );
    
    new QRCode(newsQrCode, {
        text: url,
        width: 156,
        height: 156,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel:
            QRCode.CorrectLevel.H
    });
}

function isValidQrCodeUrl(value) {
    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        return false;
    }

    try {
        const url = new URL(
            value.trim()
        );

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );
    } catch (error) {
        return false;
    }
}

function restartKenBurns() {
    newsVisual.classList.remove(
        "ken-burns"
    );

    void newsVisual.offsetWidth;

    newsVisual.classList.add(
        "ken-burns"
    );
}

function showNextNews() {
    if (displayNewsList.length <= 1) {
        return;
    }

    fadeOut(newsVisual);

    setTimeout(() => {
        currentNewsIndex =
            (currentNewsIndex + 1) %
            displayNewsList.length;

        displayNews(currentNewsIndex);
        fadeIn(newsVisual);
        scheduleNextNews();
    }, 500);
}

function showNews(index) {
    if (
        index === currentNewsIndex ||
        !displayNewsList[index]
    ) {
        return;
    }

    stopSlideshow();
    fadeOut(newsVisual);

    setTimeout(() => {
        currentNewsIndex = index;

        displayNews(currentNewsIndex);
        fadeIn(newsVisual);
        scheduleNextNews();
    }, 500);
}

function scheduleNextNews() {
    stopSlideshow();

    if (displayNewsList.length <= 1) {
        return;
    }

    const currentNews =
        displayNewsList[currentNewsIndex];

    const currentDuration =
        getSlideDuration(currentNews);

    slideshowTimer = setTimeout(
        showNextNews,
        currentDuration
    );
}

function startSlideshow() {
    scheduleNextNews();
}

function stopSlideshow() {
    if (slideshowTimer) {
        clearTimeout(slideshowTimer);
        slideshowTimer = null;
    }
}

function createPagination() {
    newsPagination.innerHTML = "";

    displayNewsList.forEach(
        (item, index) => {
            const dot =
                document.createElement(
                    "button"
                );

            dot.className = "news-dot";
            dot.type = "button";

            dot.setAttribute(
                "aria-label",
                `Afficher l’actualité ${index + 1}`
            );

            dot.addEventListener(
                "click",
                () => {
                    showNews(index);
                }
            );

            newsPagination.appendChild(
                dot
            );
        }
    );
}

function updatePagination() {
    const dots =
        newsPagination.querySelectorAll(
            ".news-dot"
        );

    dots.forEach((dot, index) => {
        dot.classList.toggle(
            "active",
            index === currentNewsIndex
        );
    });
}

window.addEventListener(
    "storage",
    (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }

        stopSlideshow();
        loadNews();
    }
);

document.addEventListener(
    "visibilitychange",
    () => {
        if (!document.hidden) {
            stopSlideshow();
            loadNews();
        }
    }
);