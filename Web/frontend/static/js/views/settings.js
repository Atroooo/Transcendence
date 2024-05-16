import abstractView from "./abstractView.js";

export default class extends abstractView {
    constructor(params) {
        super(params);
        this.setTitle("Settings");
    }

    async getHtml(pathToHtml) {
        const html = await fetch(pathToHtml[0]).then(response => response.text());
        document.querySelector(".main").innerHTML = html;
        const nav = await fetch(pathToHtml[1]).then(response => response.text());
        document.querySelector("#header").innerHTML = nav;
        const footer = await fetch(pathToHtml[2]).then(response => response.text());
        document.querySelector("#footer").innerHTML = footer;        
    }

    loadCSSFile(filePath) {
        filePath.forEach(path => {
            const linkElement = document.createElement("link");
            linkElement.rel = "stylesheet";
            linkElement.type = "text/css";
            linkElement.href = path;
            document.head.appendChild(linkElement);
        });
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
        document.body.appendChild(scriptElement);
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