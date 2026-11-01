(() => {
    const storageKey = "nova-theme";

    function readTheme() {
        try {
            const savedTheme = localStorage.getItem(storageKey);
            return savedTheme === "light" || savedTheme === "dark"
                ? savedTheme
                : "dark";
        } catch (error) {
            console.error("Could not read the saved theme preference.", error);
            return "dark";
        }
    }

    function applyTheme(theme, savePreference = false) {
        document.documentElement.dataset.theme = theme;

        if (savePreference) {
            try {
                localStorage.setItem(storageKey, theme);
            } catch (error) {
                console.error("Could not save the theme preference.", error);
            }
        }

        const toggle = document.getElementById("themeToggle");
        const icon = document.getElementById("themeIcon");
        const label = document.getElementById("themeLabel");
        const nextTheme = theme === "dark" ? "light" : "dark";
        const action = `Switch to ${nextTheme} theme`;

        if (toggle) {
            toggle.setAttribute("aria-label", action);
            toggle.title = action;
        }
        if (icon) {
            icon.textContent = theme === "dark" ? "☀" : "☾";
        }
        if (label) {
            label.textContent = theme === "dark" ? "Light" : "Dark";
        }
    }

    applyTheme(readTheme());

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("themeToggle");
        if (!toggle) {
            return;
        }

        applyTheme(document.documentElement.dataset.theme || "dark");
        toggle.addEventListener("click", () => {
            const currentTheme = document.documentElement.dataset.theme;
            applyTheme(currentTheme === "dark" ? "light" : "dark", true);
        });
    });
})();
