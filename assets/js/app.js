function updateClock() {
    const clock = document.getElementById("clock");

    if (!clock) {
        return;
    }

    const now = new Date();

    clock.textContent = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

updateClock();
setInterval(updateClock, 1000);