export function initializeI18next(lang) {
    i18next
      .use(i18nextXHRBackend)
      .init({
        lng: lang, // Default language
        fallbackLng: "fr", // Fallback language if a translation is not available
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to your translation files
        },
      })
      .then(() => {
          return i18next.loadNamespaces('translation');
        })
        .then(() => {
          document.body.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            element.innerHTML = i18next.t(key);
        });
        document.body.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
          const key = element.getAttribute('data-i18n-placeholder');
          element.setAttribute('placeholder', i18next.t(key));
        });
        document.body.querySelectorAll('[data-i18n-value]').forEach((element) => {
          const key = element.getAttribute('data-i18n-value');
          element.setAttribute('value', i18next.t(key));
        });
      });
}