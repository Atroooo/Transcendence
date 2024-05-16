
const optionsData = {
    'fi-us': ['fi fi-fr', 'fi fi-es'],
    'fi-es': ['fi fi-us', 'fi fi-fr'],
    'fi-fr': ['fi fi-us', 'fi fi-es']
};

const language = document.querySelector('.select-selected');
if (language) {

    if (localStorage.getItem('language')) {
        language.innerHTML = `<span class="fi ${localStorage.getItem('language')}" value></span>`;
        setLanguageOptions(localStorage.getItem('language'));
    } else {
        language.innerHTML = `<span class="fi fi-fr" value></span>`;
    }

    function toggleDropdown() {
        const selectOptions = document.querySelector('.select-options');
        selectOptions.style.display = (selectOptions.style.display === 'block') ? 'none' : 'block';
    }

    function setLanguageOptions(option) {
        const choices = document.querySelector('.select-options');
        const relatedOptions = optionsData[option];
        if (relatedOptions) {
            choices.innerHTML = relatedOptions.map(relatedOption => `
            <div>
                <span class="${relatedOption}" value="${relatedOption.split('-')[1]}"></span>
            </div>`).join('');
        }
    }

    function selectOption(option) {
        const selectedElement = document.querySelector('.select-selected');
        selectedElement.innerHTML = `<span class="fi ${option}" value></span>`;
        toggleDropdown();
        localStorage.setItem('language', option);
        setLanguageOptions(option);
        const newLanguage = option.split('-')[1]; 
        i18next.changeLanguage(newLanguage);
        window.location.reload();
    }

    document.querySelector('.custom-select').addEventListener('mouseover', () => {
        document.querySelector('.select-options').style.display = 'block';
    });

    document.querySelector('.custom-select').addEventListener('mouseout', () => {
        document.querySelector('.select-options').style.display = 'none';
    });

    document.querySelector('.select-options').addEventListener('click', (event) => {
        const secondClass = event.target.classList[1];
        if (secondClass)
            selectOption(secondClass);
    });

}