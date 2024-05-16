import abstractView from "./abstractView.js";


export default class extends abstractView {
    constructor() {
        super();
        this.setTitle("Register");
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

    executeViewScript(filePath) {
        if (filePath === "")
            return;
        const scriptElement = document.createElement("script");
        scriptElement.defer = true;
        scriptElement.type = "module";
        scriptElement.src = filePath;
        document.head.appendChild(scriptElement);
    }

}