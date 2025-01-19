document.addEventListener('DOMContentLoaded', function () {
    const apiKeyStorageKey = 'exchangeRateApiKey';
    const apiInfoElement = document.getElementById('api-info');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsWindow = document.getElementById('settings-window');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiKeyInput = document.getElementById('api-key');

    // Load API key from storage
    chrome.storage.local.get([apiKeyStorageKey], function (result) {
        if (result[apiKeyStorageKey]) {
            apiKeyInput.value = result[apiKeyStorageKey];
            updateApiInfo(result[apiKeyStorageKey]);
        }
    });

    // Save API key to storage
    saveSettingsBtn.addEventListener('click', function () {
        const apiKey = apiKeyInput.value;
        chrome.storage.local.set({ [apiKeyStorageKey]: apiKey }, function () {
            alert('API Key saved');
            updateApiInfo(apiKey);
        });
    });

    // Toggle settings window visibility
    settingsBtn.addEventListener('click', function () {
        settingsWindow.style.display = settingsWindow.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.currency-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('from_currency').value = button.getAttribute('data-currency');
            document.querySelectorAll('.currency-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    document.getElementById('currency-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const amount = document.getElementById('amount').value;
        const fromCurrency = document.getElementById('from_currency').value;
        const apiKey = apiKeyInput.value;
        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    const currencies = ['UAH', 'ISK', 'USD', 'TRY', 'EUR'];
                    let results = '';
                    currencies.forEach(currency => {
                        if (currency !== fromCurrency) {
                            const rate = data.conversion_rates[currency];
                            const convertedAmount = (amount * rate).toFixed(2);
                            results += `<p>${amount} ${fromCurrency} =>  ${convertedAmount} ${currency}</p>`;
                        }
                    });
                    document.getElementById('result').innerHTML = results;
                } else {
                    document.getElementById('result').innerHTML = 'Failed to retrieve exchange rates.';
                }
            })
            .catch(error => {
                document.getElementById('result').innerHTML = 'Error: ' + error.message;
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
            });
    }
});
