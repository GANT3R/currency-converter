document.addEventListener('DOMContentLoaded', function () {
    // --- Constants ---
    const apiKeyStorageKey = 'exchangeRateApiKey';
    const numButtonsStorageKey = 'numCurrencyButtons';
    const selectedCurrenciesStorageKey = 'selectedCurrencies';
    const themeStorageKey = 'selectedTheme'; // Key for theme preference

    // --- DOM Element References ---
    const apiInfoElement = document.getElementById('api-info');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsWindow = document.getElementById('settings-window');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const exitSettingsBtn = document.getElementById('exit-settings-btn');
    const apiKeyInput = document.getElementById('api-key');
    const numButtonsInput = document.getElementById('num-buttons');
    const currencyButtonsContainer = document.getElementById('currency-buttons');
    const contextMenu = document.getElementById('context-menu');
    const currencyForm = document.getElementById('currency-form');
    const amountInput = document.getElementById('amount');
    const fromCurrencyInput = document.getElementById('from_currency');
    const resultDiv = document.getElementById('result');
    const settingsBtnContainer = document.querySelector('.settings-btn-container');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const iconEye = toggleApiKeyBtn ? toggleApiKeyBtn.querySelector('.icon-eye') : null;
    const iconEyeOff = toggleApiKeyBtn ? toggleApiKeyBtn.querySelector('.icon-eye-off') : null;
    const themeToggle = document.getElementById('theme-toggle'); // Theme toggle checkbox

    // --- Dynamic Element Creation ---
    const checkmarkContainer = document.createElement('div');
    checkmarkContainer.className = 'checkmark-container';
    const checkmark = document.createElement('div');
    checkmark.className = 'checkmark';
    checkmarkContainer.appendChild(checkmark);

    if (settingsBtnContainer) {
        settingsBtnContainer.insertBefore(checkmarkContainer, settingsBtnContainer.firstChild);
    }

    // --- Data ---
    const currencies = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'CNY': '¥',
  'SEK': 'kr',
  'NZD': 'NZ$',
  'MXN': '$',
  'SGD': 'S$',
  'HKD': 'HK$',
  'NOK': 'kr',
  'KRW': '₩',
  'TRY': '₺',
  'INR': '₹',
  'RUB': '₽',
  'BRL': 'R$',
  'ZAR': 'R',
  'DKK': 'kr',
  'PLN': 'zł',
  'THB': '฿',
  'IDR': 'Rp',
  'HUF': 'Ft',
  'CZK': 'Kč',
  'ILS': '₪',
  'PHP': '₱',
  'AED': 'Dh',
  'SAR': 'SR',
  'MYR': 'RM',
  'RON': 'lei',
  'UAH': '₴',
  'ISK': 'kr',
  'VND': '₫',
  'EGP': 'E£',
  'ARS': '$',
  'BGN': 'лв',
  'MAD': 'Dh',
  'PKR': '₨',
  'BDT': '৳',
  'KZT': '₸'
};
    const allCurrencyCodes = Object.keys(currencies);
    let currentNumButtons = 3;
    let selectedCurrencyButtons = ['USD', 'EUR', 'GBP'];

    // --- Functions ---
    function applyTheme(theme) {
        if (theme === 'gradient') {
            document.body.dataset.theme = 'gradient';
        } else {
            delete document.body.dataset.theme;
        }
        if (themeToggle) {
            themeToggle.checked = (theme === 'gradient');
        }
    }

    function createCurrencyButton(currency) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'currency-btn';
        button.dataset.currency = currency;
        button.textContent = `${currency} (${currencies[currency] || '?'})`;
        button.title = `Select ${currency} as base currency`;

        button.addEventListener('click', () => {
            fromCurrencyInput.value = currency;
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
        const currentButtonCurrencies = Array.from(currencyButtonsContainer.children)
                                             .map(btn => btn.dataset.currency);
        const otherAvailableCurrencies = allCurrencyCodes.filter(c => !currentButtonCurrencies.includes(c));
        otherAvailableCurrencies.sort();

        if (otherAvailableCurrencies.length === 0) {
             const li = document.createElement('li');
             li.textContent = "No other currencies";
             li.style.cursor = 'default';
             li.style.color = 'var(--text-muted)';
             contextMenu.appendChild(li);
        } else {
            otherAvailableCurrencies.forEach(currency => {
                const listItem = document.createElement('li');
                listItem.dataset.currency = currency;
                listItem.textContent = `${currency} (${currencies[currency] || '?'})`;
                listItem.title = `Change to ${currency}`;
                listItem.onclick = () => {
                    button.textContent = `${currency} (${currencies[currency] || '?'})`;
                    button.dataset.currency = currency;
                    if (button.classList.contains('selected')) {
                        fromCurrencyInput.value = currency;
                    }
                    contextMenu.style.display = 'none';
                    selectedCurrencyButtons = Array.from(currencyButtonsContainer.children).map(btn => btn.dataset.currency);
                    saveSelectedCurrencies();
                };
                contextMenu.appendChild(listItem);
            });
        }

        contextMenu.style.display = 'block';
        const menuHeight = contextMenu.offsetHeight;
        const menuWidth = contextMenu.offsetWidth;
        const bodyHeight = document.body.clientHeight;
        const bodyWidth = document.body.clientWidth;
        let top = event.pageY;
        let left = event.pageX;
        if (top + menuHeight > bodyHeight) top = Math.max(0, bodyHeight - menuHeight - 5);
        if (left + menuWidth > bodyWidth) left = Math.max(0, bodyWidth - menuWidth - 5);
        contextMenu.style.top = `${top}px`;
        contextMenu.style.left = `${left}px`;

        const hideMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
                document.removeEventListener('click', hideMenu, true);
            }
        };
        setTimeout(() => {
             document.addEventListener('click', hideMenu, true);
        }, 0);
    }

    function updateCurrencyButtons() {
        const currentSelectedValue = fromCurrencyInput.value;
        let valueStillPresent = false;
        let buttonsToDisplayCodes = [...selectedCurrencyButtons];

        if (buttonsToDisplayCodes.length > currentNumButtons) {
            buttonsToDisplayCodes = buttonsToDisplayCodes.slice(0, currentNumButtons);
        } else if (buttonsToDisplayCodes.length < currentNumButtons) {
            const needed = currentNumButtons - buttonsToDisplayCodes.length;
            const currentButtonsSet = new Set(buttonsToDisplayCodes);
            const availableToAdd = allCurrencyCodes.filter(code => !currentButtonsSet.has(code));
            buttonsToDisplayCodes.push(...availableToAdd.slice(0, needed));
        }

        selectedCurrencyButtons = [...buttonsToDisplayCodes];

        currencyButtonsContainer.innerHTML = '';
        buttonsToDisplayCodes.forEach((currency) => {
            const button = createCurrencyButton(currency);
            currencyButtonsContainer.appendChild(button);
            if (currency === currentSelectedValue) {
                button.classList.add('selected');
                valueStillPresent = true;
            }
        });

        if (!valueStillPresent && currencyButtonsContainer.firstChild) {
            currencyButtonsContainer.firstChild.classList.add('selected');
            fromCurrencyInput.value = currencyButtonsContainer.firstChild.dataset.currency;
        } else if (currencyButtonsContainer.children.length === 0) {
             fromCurrencyInput.value = 'USD';
        } else if (!document.querySelector('.currency-btn.selected') && currencyButtonsContainer.firstChild) {
             currencyButtonsContainer.firstChild.classList.add('selected');
             fromCurrencyInput.value = currencyButtonsContainer.firstChild.dataset.currency;
        }
        saveSelectedCurrencies();
    }

    function saveSettings() {
        const apiKey = apiKeyInput.value.trim();
        let numButtonsValue = parseInt(numButtonsInput.value, 10);
        const minButtons = parseInt(numButtonsInput.min, 10) || 3;
        const maxButtons = parseInt(numButtonsInput.max, 10) || 7;

        if (isNaN(numButtonsValue) || numButtonsValue < minButtons) numButtonsValue = minButtons;
        else if (numButtonsValue > maxButtons) numButtonsValue = maxButtons;

        numButtonsInput.value = numButtonsValue;
        const numButtonsChanged = currentNumButtons !== numButtonsValue;
        currentNumButtons = numButtonsValue;

        chrome.storage.local.set({
            [apiKeyStorageKey]: apiKey,
            [numButtonsStorageKey]: currentNumButtons,
             [selectedCurrenciesStorageKey]: selectedCurrencyButtons
        }, function () {
            if (chrome.runtime.lastError) {
                console.error("Error saving settings:", chrome.runtime.lastError);
            } else {
                checkmark.classList.add('show');
                setTimeout(() => checkmark.classList.remove('show'), 2000);
                updateApiInfo(apiKey);
                 if (numButtonsChanged) {
                      updateCurrencyButtons();
                 }
            }
        });
    }

    function saveSelectedCurrencies() {
        chrome.storage.local.set({ [selectedCurrenciesStorageKey]: selectedCurrencyButtons }, function() {
             if (chrome.runtime.lastError) {
                console.error("Error saving selected currencies:", chrome.runtime.lastError);
            }
        });
    }

     function updateApiInfo(apiKey) {
        if (!apiKey) {
            apiInfoElement.innerText = 'API Key not set.';
            apiInfoElement.style.color = 'var(--danger-color)';
            return;
        }
        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/quota`;
        apiInfoElement.innerText = 'Checking API quota...';
        apiInfoElement.style.color = 'var(--text-muted)';

        fetch(apiUrl)
            .then(response => {
                if (response.status === 401 || response.status === 403) {
                     return response.json().then(errData => {
                         const errorType = errData['error-type'] || `Access Denied (Status ${response.status})`;
                         throw new Error(`API Error: ${errorType}`);
                     }).catch(() => {
                         throw new Error(`Access Denied (Status ${response.status})`);
                     });
                }
                 if (!response.ok) {
                     throw new Error(`Quota check failed (Status: ${response.status})`);
                 }
                return response.json();
            })
            .then(data => {
                if (data.result === 'success') {
                    apiInfoElement.innerText = `API Requests Remaining: ${data.requests_remaining || 'N/A'}`;
                    apiInfoElement.style.color = 'var(--text-muted)';
                } else {
                    const errorType = data['error-type'] || 'Unknown API Error';
                    throw new Error(`API Info Error: ${errorType}`);
                }
            })
            .catch(error => {
                let displayMessage = error.message;
                if (displayMessage.includes('invalid-key')) displayMessage = "Invalid API Key";
                else if (displayMessage.includes('inactive-account')) displayMessage = "API Key Inactive";
                else if (displayMessage.includes('quota-reached')) displayMessage = "API Quota Reached";
                apiInfoElement.innerText = `Error: ${displayMessage}`;
                apiInfoElement.style.color = 'var(--danger-color)';
                console.error('Error fetching API info:', error);
            });
    }

    // --- Event Listeners & Initial Load ---
    chrome.storage.local.get(
        [apiKeyStorageKey, numButtonsStorageKey, selectedCurrenciesStorageKey, themeStorageKey], // Add theme key
        function (result) {
            // Apply theme first
            applyTheme(result[themeStorageKey] || 'default'); // Use 'default' if not set

            // Load other settings
            let loadedApiKey = '';
            if (result[apiKeyStorageKey]) {
                apiKeyInput.value = result[apiKeyStorageKey];
                loadedApiKey = result[apiKeyStorageKey];
            }

            if (result[numButtonsStorageKey]) {
                currentNumButtons = parseInt(result[numButtonsStorageKey], 10);
                const minButtons = parseInt(numButtonsInput.min, 10) || 3;
                const maxButtons = parseInt(numButtonsInput.max, 10) || 7;
                if (isNaN(currentNumButtons) || currentNumButtons < minButtons || currentNumButtons > maxButtons) {
                    currentNumButtons = minButtons;
                }
            } else {
                 currentNumButtons = parseInt(numButtonsInput.value, 10) || 3;
            }
             numButtonsInput.value = currentNumButtons;

            if (result[selectedCurrenciesStorageKey] && Array.isArray(result[selectedCurrenciesStorageKey]) && result[selectedCurrenciesStorageKey].length > 0) {
                 selectedCurrencyButtons = result[selectedCurrenciesStorageKey];
            } else {
                selectedCurrencyButtons = ['USD', 'EUR', 'GBP'];
            }

             const initialFromValue = fromCurrencyInput.value;
             const buttonsToDisplay = selectedCurrencyButtons.slice(0, currentNumButtons);
             if (!buttonsToDisplay.includes(initialFromValue) && buttonsToDisplay.length > 0) {
                 fromCurrencyInput.value = buttonsToDisplay[0];
             } else if (buttonsToDisplay.length === 0) {
                  fromCurrencyInput.value = 'USD';
             }

            updateCurrencyButtons();
            updateApiInfo(loadedApiKey);
        }
    );

    settingsBtn.addEventListener('click', function () {
        const isHidden = settingsWindow.style.display === 'none' || settingsWindow.style.display === '';
        settingsWindow.style.display = isHidden ? 'block' : 'none';
    });

    saveSettingsBtn.addEventListener('click', saveSettings);

    exitSettingsBtn.addEventListener('click', function () {
        settingsWindow.style.display = 'none';
    });

    if(toggleApiKeyBtn && apiKeyInput && iconEye && iconEyeOff) {
        toggleApiKeyBtn.addEventListener('click', function() {
            const currentType = apiKeyInput.getAttribute('type');
            if (currentType === 'password') {
                apiKeyInput.setAttribute('type', 'text');
                iconEye.style.display = 'none';
                iconEyeOff.style.display = 'inline-block';
                toggleApiKeyBtn.title = 'Hide API Key';
            } else {
                apiKeyInput.setAttribute('type', 'password');
                iconEye.style.display = 'inline-block';
                iconEyeOff.style.display = 'none';
                toggleApiKeyBtn.title = 'Show API Key';
            }
        });
    }

    // Theme Toggle Listener
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            const selectedTheme = this.checked ? 'gradient' : 'default';
            applyTheme(selectedTheme);
            chrome.storage.local.set({ [themeStorageKey]: selectedTheme });
        });
    }


    currencyForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const amount = amountInput.value;
        const fromCurrency = fromCurrencyInput.value;
        const apiKey = apiKeyInput.value.trim();

        resultDiv.innerHTML = '';
        let hasError = false;
        const errorColor = 'var(--danger-color)';
        const numericAmount = parseFloat(amount);

        if (!apiKey) {
            resultDiv.innerHTML += `<p style="color: ${errorColor};">API Key missing. Please set in Settings.</p>`;
            hasError = true;
        }
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            resultDiv.innerHTML += `<p style="color: ${errorColor};">Please enter a valid positive amount.</p>`;
            if (!hasError) amountInput.focus();
            hasError = true;
        }
        if (!fromCurrency || !currencies[fromCurrency]) {
             resultDiv.innerHTML += `<p style="color: ${errorColor};">Invalid 'from' currency selected.</p>`;
             hasError = true;
        }

        if (hasError) return;

        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`;
        resultDiv.innerHTML = '<p class="loading-text">Converting...</p>';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        const errorType = errData['error-type'] || `HTTP Status ${response.status}`;
                         throw new Error(`API Error: ${errorType}`);
                    }).catch(() => {
                        throw new Error(`Network error (Status: ${response.status})`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.result === 'success') {
                    let resultsHTML = '';
                    const conversionRates = data.conversion_rates;
                    const targetCurrencies = Array.from(currencyButtonsContainer.children).map(btn => btn.dataset.currency);

                    targetCurrencies.forEach(currency => {
                        if (currency !== fromCurrency) {
                            const rate = conversionRates[currency];
                            if (rate !== undefined) {
                                const convertedAmount = (numericAmount * rate).toFixed(2);
                                const fromSymbol = currencies[fromCurrency] || '';
                                const toSymbol = currencies[currency] || '';
                                resultsHTML += `
                                    <div class="result-line">
                                        <span class="result-original">
                                            ${fromSymbol}${numericAmount} <span class="currency-code">${fromCurrency}</span>
                                        </span>
                                        <span class="result-arrow">➔</span>
                                        <span class="result-converted">
                                            ${toSymbol}${convertedAmount} <span class="currency-code">${currency}</span>
                                        </span>
                                    </div>`;
                            } else {
                                resultsHTML += `<p class="error-text">Rate for ${currency} unavailable.</p>`;
                            }
                        }
                    });
                    resultDiv.innerHTML = resultsHTML || '<p>No other currencies selected for conversion.</p>';
                } else {
                    const errorType = data['error-type'] || 'Unknown API Error';
                    throw new Error(`API Error: ${errorType}`);
                }
            })
            .catch(error => {
                let displayMessage = error.message;
                 if (displayMessage.includes('invalid-key')) displayMessage = "Invalid API Key";
                 else if (displayMessage.includes('inactive-account')) displayMessage = "API Key Inactive";
                 else if (displayMessage.includes('quota-reached')) displayMessage = "API Quota Reached";
                 else if (displayMessage.includes('unsupported-code')) displayMessage = `'From' Currency Unsupported (${fromCurrency})`;
                 else if (displayMessage.includes('malformed-request')) displayMessage = "Malformed API Request";
                resultDiv.innerHTML = `<p class="error-text" style="color: ${errorColor};">Error: ${displayMessage}</p>`;
                console.error('Error fetching exchange rates:', error);
                 if (error.message.includes('invalid-key') || error.message.includes('inactive-account')) {
                   updateApiInfo(apiKey);
                 }
            });
    });

}); // End of DOMContentLoaded
