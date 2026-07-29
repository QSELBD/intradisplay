function updateClock() {
    const clockElement = document.getElementById("clock");

    if (!clockElement) return;

    const now = new Date();

    clockElement.textContent = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}