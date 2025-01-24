document.addEventListener('DOMContentLoaded', function () {
    const apiKeyStorageKey = 'exchangeRateApiKey';
    const numButtonsStorageKey = 'numCurrencyButtons';
    const selectedCurrenciesStorageKey = 'selectedCurrencies';
    const apiInfoElement = document.getElementById('api-info');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsWindow = document.getElementById('settings-window');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const exitSettingsBtn = document.getElementById('exit-settings-btn'); // Exit button reference
    const apiKeyInput = document.getElementById('api-key');
    const numButtonsInput = document.getElementById('num-buttons');
    const currencyButtonsContainer = document.getElementById('currency-buttons');
    const contextMenu = document.getElementById('context-menu');
    const checkmarkContainer = document.createElement('div');
    checkmarkContainer.className = 'checkmark-container';
    const checkmark = document.createElement('div');
    checkmark.className = 'checkmark';
    checkmarkContainer.appendChild(checkmark);
    
    // Define currencies with their symbols
    const currencies = {
        'USD': '$',
        'EUR': '€',
        'CNY': '¥',
        'UAH': '₴',
        'ISK': 'kr',
        'TRY': '₺',
        'CAD': 'C$',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CHF': 'CHF',
        'NOK': 'kr',
        'SEK': 'kr',
        'INR': '₹',
        'BRL': 'R$',
        'MXN': '$',
        'PLN': 'zł',
        'RUB': '₽',
        'ARS': '$',
        'BGN': 'лв',
        'ILS': '₪',
        'VND': '₫' 
    };
    
    const defaultCurrencies = ['USD', 'EUR', 'CNY']; // Set default currencies
    const additionalCurrencies = Object.keys(currencies).filter(currency => !defaultCurrencies.includes(currency));

    let currentNumButtons = 3; // Default to 3 buttons

    numButtonsInput.min = 3;
    numButtonsInput.max = 7;

    function createCurrencyButton(currency) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'currency-btn';
        button.dataset.currency = currency;
        button.textContent = `${currency} (${currencies[currency]})`;
        button.addEventListener('click', () => {
            document.getElementById('from_currency').value = currency;
            document.querySelectorAll('.currency-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            showContextMenu(event, button);
        });
        return button;
    }

    function showContextMenu(event, button) {
        contextMenu.innerHTML = '';
        const selectedCurrencies = Array.from(document.querySelectorAll('.currency-btn')).map(btn => btn.dataset.currency);
        const allCurrencies = defaultCurrencies.concat(additionalCurrencies).filter(currency => !selectedCurrencies.includes(currency));
        allCurrencies.forEach(currency => {
            const listItem = document.createElement('li');
            listItem.dataset.currency = currency;
            listItem.textContent = `${currency} (${currencies[currency]})`;
            listItem.onclick = () => {
                button.textContent = `${currency} (${currencies[currency]})`;
                button.dataset.currency = currency;
                contextMenu.style.display = 'none';
                updateCurrencyButtons();
                saveSelectedCurrencies(); // Save selected currencies to storage
            };
            contextMenu.appendChild(listItem);
        });
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        }, { once: true });
    }

    function updateCurrencyButtons() {
        const selectedCurrencies = Array.from(currencyButtonsContainer.children).map(btn => btn.dataset.currency);
        const availableCurrencies = defaultCurrencies.concat(additionalCurrencies).filter(currency => !selectedCurrencies.includes(currency));
        currencyButtonsContainer.innerHTML = '';
        
        // Ensure only the specified number of buttons are created
        selectedCurrencies.slice(0, currentNumButtons).forEach(currency => {
            const button = createCurrencyButton(currency);
            currencyButtonsContainer.appendChild(button);
        });

        // Fill up to currentNumButtons with available currencies if needed
        if (selectedCurrencies.length < currentNumButtons) {
            availableCurrencies.slice(0, currentNumButtons - selectedCurrencies.length).forEach(currency => {
                const button = createCurrencyButton(currency);
                currencyButtonsContainer.appendChild(button);
            });
        }
    }

    function saveSettings() {
        const apiKey = apiKeyInput.value;
        currentNumButtons = parseInt(numButtonsInput.value, 10);
        chrome.storage.local.set({
            [apiKeyStorageKey]: apiKey,
            [numButtonsStorageKey]: currentNumButtons,
            [selectedCurrenciesStorageKey]: Array.from(currencyButtonsContainer.children).map(btn => btn.dataset.currency)
        }, function () {
            // Show the animated checkmark
            checkmark.classList.add('show');
            setTimeout(() => {
                checkmark.classList.remove('show');
            }, 2000); // Hide the checkmark after 2 seconds
            updateApiInfo(apiKey);
            updateCurrencyButtons();
        });
    }

    function saveSelectedCurrencies() {
        chrome.storage.local.set({
            [selectedCurrenciesStorageKey]: Array.from(currencyButtonsContainer.children).map(btn => btn.dataset.currency)
        });
    }

    // Load settings from storage
    chrome.storage.local.get([apiKeyStorageKey, numButtonsStorageKey, selectedCurrenciesStorageKey], function (result) {
        if (result[apiKeyStorageKey]) {
            apiKeyInput.value = result[apiKeyStorageKey];
            updateApiInfo(result[apiKeyStorageKey]);
        }
        if (result[numButtonsStorageKey]) {
            currentNumButtons = result[numButtonsStorageKey];
            numButtonsInput.value = currentNumButtons;
        }
        if (result[selectedCurrenciesStorageKey]) {
            result[selectedCurrenciesStorageKey].forEach(currency => {
                const button = createCurrencyButton(currency);
                currencyButtonsContainer.appendChild(button);
            });
        } else {
            updateCurrencyButtons();
        }
    });

    // Save settings to storage
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Toggle settings window visibility
    settingsBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default form submission
        settingsWindow.style.display = settingsWindow.style.display === 'none' ? 'block' : 'none';
    });

    // Exit settings window
    exitSettingsBtn.addEventListener('click', function () {
        settingsWindow.style.display = 'none';
    });

    document.getElementById('currency-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const amount = document.getElementById('amount').value;
        const fromCurrency = document.getElementById('from_currency').value;
        const apiKey = apiKeyInput.value; // No masking of API key
        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.result === 'success') {
                    let results = '';
                    const currencies = Array.from(currencyButtonsContainer.children).map(button => button.dataset.currency);
                    currencies.forEach(currency => {
                        if (currency !== fromCurrency) {
                            const rate = data.conversion_rates[currency];
                            const convertedAmount = (amount * rate).toFixed(2);
                            results += `<p>${amount} ${fromCurrency} ==> ${convertedAmount} ${currency}</p>`;
                        }
                    });
                    document.getElementById('result').innerHTML = results;
                } else {
                    document.getElementById('result').innerHTML = 'Failed to retrieve exchange rates.';
                }
            })
            .catch(error => {
                document.getElementById('result').innerHTML = 'Error: ' + error.message;
                console.error('Error fetching exchange rates:', error);
            });
    });

    function updateApiInfo(apiKey) {
        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/quota`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    apiInfoElement.innerText = `Requests left: ${data.requests_remaining}`;
                } else {
                    apiInfoElement.innerText = 'Failed to retrieve API info.';
                }
            })
            .catch(error => {
                apiInfoElement.innerText = 'Error: ' + error.message;
                console.error('Error fetching API info:', error);
            });
    }

    // Append the checkmarkContainer in the settings-btn-container
    const settingsBtnContainer = document.querySelector('.settings-btn-container');
    settingsBtnContainer.insertBefore(checkmarkContainer, settingsBtnContainer.firstChild);
});