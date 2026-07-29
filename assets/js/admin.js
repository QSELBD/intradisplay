const STORAGE_KEY = "gam-display-news";
const DEFAULT_NEWS_URL = "../data/news.json";

const newsForm = document.getElementById("news-form");
const newsIdInput = document.getElementById("news-id");
const categoryInput =
    document.getElementById("news-category-input");
const titleInput =
    document.getElementById("news-title-input");
const textInput =
    document.getElementById("news-text-input");
const imageInput =
    document.getElementById("news-image-input");

const imagePreview =
    document.getElementById("image-preview");
const newsList =
    document.getElementById("news-list");
const statusMessage =
    document.getElementById("status-message");
const cancelEditButton =
    document.getElementById("cancel-edit");
const restoreDefaultButton =
    document.getElementById("restore-default");
const formHeading =
    document.getElementById("form-heading");

let news = [];
let selectedImage = "";
let currentEditId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();
});

async function initializeAdmin() {
    await loadNews();
    renderNewsList();
}

async function loadNews() {
    try {
        const savedNews = localStorage.getItem(STORAGE_KEY);

        if (savedNews) {
            news = JSON.parse(savedNews);
            return;
        }

        await loadDefaultNews();
    } catch (error) {
        console.error(error);
        news = [];

        showStatus(
            "Impossible de charger les actualités.",
            "error"
        );
    }
}

async function loadDefaultNews() {
    const response = await fetch(DEFAULT_NEWS_URL);

    if (!response.ok) {
        throw new Error(
            "Impossible de charger le fichier JSON."
        );
    }

    news = await response.json();
    saveNews();
}

function saveNews() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(news)
    );
}

function createId() {
    return Date.now();
}

function normalizeNewsItem(item) {
    return {
        id: item.id || createId(),
        titre: item.titre || item.title || "",
        categorie:
            item.categorie ||
            item.category ||
            "Actualité",
        texte:
            item.texte ||
            item.text ||
            item.description ||
            "",
        image: item.image || ""
    };
}

function getImageUrl(image) {
    if (!image) {
        return "";
    }

    if (
        image.startsWith("data:") ||
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    if (
        image.startsWith("../") ||
        image.startsWith("./")
    ) {
        return image;
    }

    return `../assets/images/${image}`;
}

function renderNewsList() {
    newsList.innerHTML = "";

    if (news.length === 0) {
        newsList.innerHTML = `
            <div class="empty-state">
                Aucune actualité publiée.
            </div>
        `;

        return;
    }

    news.forEach((rawItem, index) => {
        const item = normalizeNewsItem(rawItem);
        const card = document.createElement("article");

        card.className = "news-card";

        const imageUrl = getImageUrl(item.image);

        card.innerHTML = `
            <div
                class="news-card-image"
                ${
                    imageUrl
                        ? `style="background-image:
                           url('${imageUrl}')"`
                        : ""
                }
            ></div>

            <div class="news-card-content">
                <p class="news-card-category">
                    ${escapeHtml(item.categorie)}
                </p>

                <h3>
                    ${escapeHtml(item.titre)}
                </h3>

                <p class="news-card-text">
                    ${escapeHtml(item.texte)}
                </p>

                <div class="news-card-actions">
                    <button
                        class="card-button"
                        type="button"
                        data-action="edit"
                        data-index="${index}"
                    >
                        Modifier
                    </button>

                    <button
                        class="card-button"
                        type="button"
                        data-action="up"
                        data-index="${index}"
                        ${index === 0 ? "disabled" : ""}
                    >
                        Monter
                    </button>

                    <button
                        class="card-button"
                        type="button"
                        data-action="down"
                        data-index="${index}"
                        ${
                            index === news.length - 1
                                ? "disabled"
                                : ""
                        }
                    >
                        Descendre
                    </button>

                    <button
                        class="card-button delete"
                        type="button"
                        data-action="delete"
                        data-index="${index}"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        `;

        newsList.appendChild(card);
    });
}

newsList.addEventListener("click", (event) => {
    const button = event.target.closest(
        "button[data-action]"
    );

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || !news[index]) {
        return;
    }

    if (action === "edit") {
        startEdit(index);
    }

    if (action === "up") {
        moveNews(index, index - 1);
    }

    if (action === "down") {
        moveNews(index, index + 1);
    }

    if (action === "delete") {
        deleteNews(index);
    }
});

imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    try {
        selectedImage = await resizeImage(file);
        showImagePreview(selectedImage);
    } catch (error) {
        console.error(error);

        showStatus(
            "Impossible de traiter cette image.",
            "error"
        );
    }
});

newsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const titre = titleInput.value.trim();
    const categorie = categoryInput.value.trim();
    const texte = textInput.value.trim();

    if (!titre || !categorie || !texte) {
        showStatus(
            "Tous les champs de texte sont obligatoires.",
            "error"
        );

        return;
    }

    if (currentEditId !== null) {
        const index = news.findIndex(
            (item) => item.id === currentEditId
        );

        if (index === -1) {
            showStatus(
                "Cette actualité est introuvable.",
                "error"
            );

            return;
        }

        news[index] = {
            ...news[index],
            titre,
            categorie,
            texte,
            image:
                selectedImage ||
                news[index].image ||
                ""
        };

        showStatus(
            "Actualité modifiée.",
            "success"
        );
    } else {
        news.push({
            id: createId(),
            titre,
            categorie,
            texte,
            image: selectedImage
        });

        showStatus(
            "Actualité ajoutée.",
            "success"
        );
    }

    saveNews();
    renderNewsList();
    resetForm();
});

cancelEditButton.addEventListener("click", () => {
    resetForm();
});

restoreDefaultButton.addEventListener(
    "click",
    async () => {
        const confirmed = window.confirm(
            "Restaurer les actualités du fichier JSON ?"
        );

        if (!confirmed) {
            return;
        }

        try {
            localStorage.removeItem(STORAGE_KEY);
            await loadDefaultNews();

            renderNewsList();
            resetForm();

            showStatus(
                "Les actualités d’origine ont été restaurées.",
                "success"
            );
        } catch (error) {
            console.error(error);

            showStatus(
                "La restauration a échoué.",
                "error"
            );
        }
    }
);

function startEdit(index) {
    const item = normalizeNewsItem(news[index]);

    currentEditId = item.id;
    selectedImage = "";

    newsIdInput.value = item.id;
    categoryInput.value = item.categorie;
    titleInput.value = item.titre;
    textInput.value = item.texte;

    formHeading.textContent =
        "Modifier l’actualité";

    cancelEditButton.hidden = false;

    if (item.image) {
        showImagePreview(
            getImageUrl(item.image)
        );
    } else {
        clearImagePreview();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function deleteNews(index) {
    const confirmed = window.confirm(
        `Supprimer « ${news[index].titre} » ?`
    );

    if (!confirmed) {
        return;
    }

    news.splice(index, 1);

    saveNews();
    renderNewsList();
    resetForm();

    showStatus(
        "Actualité supprimée.",
        "success"
    );
}

function moveNews(fromIndex, toIndex) {
    if (
        toIndex < 0 ||
        toIndex >= news.length
    ) {
        return;
    }

    const [movedItem] = news.splice(fromIndex, 1);
    news.splice(toIndex, 0, movedItem);

    saveNews();
    renderNewsList();

    showStatus(
        "Ordre du diaporama modifié.",
        "success"
    );
}

function resetForm() {
    newsForm.reset();

    currentEditId = null;
    selectedImage = "";

    newsIdInput.value = "";
    formHeading.textContent =
        "Ajouter une actualité";

    cancelEditButton.hidden = true;

    clearImagePreview();
}

function showImagePreview(imageUrl) {
    imagePreview.innerHTML = "";

    const image = document.createElement("img");

    image.src = imageUrl;
    image.alt = "Aperçu de l’image";

    imagePreview.appendChild(image);
}

function clearImagePreview() {
    imagePreview.textContent =
        "Aucune image sélectionnée";
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className =
        `status-message ${type}`;

    window.setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className =
            "status-message";
    }, 4000);
}

function resizeImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = reject;

        reader.onload = () => {
            const image = new Image();

            image.onerror = reject;

            image.onload = () => {
                const maxWidth = 1600;
                const scale = Math.min(
                    1,
                    maxWidth / image.width
                );

                const canvas =
                    document.createElement("canvas");

                canvas.width =
                    Math.round(image.width * scale);

                canvas.height =
                    Math.round(image.height * scale);

                const context =
                    canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.82
                    )
                );
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

function escapeHtml(value) {
    const element =
        document.createElement("div");

    element.textContent = value || "";

    return element.innerHTML;
}