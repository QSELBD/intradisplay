function fadeOut(element) {
    if (!element) {
        return;
    }

    element.classList.add("is-changing");
}

function fadeIn(element) {
    if (!element) {
        return;
    }

    element.classList.remove("is-changing");
}