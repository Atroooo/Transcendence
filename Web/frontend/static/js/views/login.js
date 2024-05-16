import abstractView from "./abstractView.js";


export default class extends abstractView {
    constructor(params) {
        super(params);
        this.setTitle("Login");
    }

    async getHtml(pathToHtml) {
        const html = await fetch(pathToHtml).then(response => response.text());
        return document.querySelector("#app").innerHTML = html;
    }

    loadCSSFile(filePath) {
        const linkElement = document.createElement("link");
        linkElement.rel = "stylesheet";
        linkElement.type = "text/css";
        linkElement.href = filePath;
        document.head.appendChild(linkElement);
    }

    loadScript(scriptUrl) {
    return new Promise((resolve, reject) => {
        const scriptElement = document.createElement("script");
        scriptElement.src = scriptUrl;
        scriptElement.type = "module";
        scriptElement.async = true;
        scriptElement.setAttribute("preload", "");
        scriptElement.onload = resolve;
        scriptElement.onerror = reject;
        document.head.appendChild(scriptElement);
        });
    }

    async executeViewScript(scripts) {
        if (scripts.length === 0)
            return;

        for (let i = 0; i < scripts.length; i++) {
            try {
                await this.loadScript(scripts[i]);
            } catch (error) {
                console.error("Error loading script:", error);
            }
        }
    }
}