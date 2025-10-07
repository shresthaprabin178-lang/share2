let stocks = JSON.parse(localStorage.getItem('stocks')) || [];

// Save to localStorage
function saveStocks() {
    localStorage.setItem('stocks', JSON.stringify(stocks));
}

// Add new stock entry
function addStock() {
    let name = document.getElementById("stockName").value.toUpperCase().trim();
    const quantity = parseFloat(document.getElementById("quantity").value);
    const wacc = parseFloat(document.getElementById("wacc").value);

    if (!name || isNaN(quantity) || quantity <= 0 || isNaN(wacc) || wacc <= 0) {
        alert("Please enter valid symbol, quantity, and WACC");
        return;
    }

    // Add stock object
    stocks.push({ name, quantity, wacc, ltp: 0 });
    clearInputs();
    saveStocks();
    displayStocks();
}

// Clear input fields
function clearInputs() {
    document.getElementById("stockName").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("wacc").value = "";
}

// Display stocks in table
function displayStocks() {
    const stockList = document.getElementById("stockList");
    stockList.innerHTML = "";

    let currentValue = 0;
    let totalPL = 0;
    let currentInvestment = 0;
    let totalProfitLoss = 0;

    stocks.forEach((stock, index) => {
        const amount = stock.ltp * stock.quantity;
        const profitLoss = (stock.ltp - stock.wacc) * stock.quantity;
        const plPercent = stock.wacc > 0 ? ((stock.ltp - stock.wacc) / stock.wacc) * 100 : 0;
        const investment = stock.wacc * stock.quantity;

        currentValue += amount;
        totalPL += profitLoss;
        currentInvestment += investment;
        totalProfitLoss += profitLoss;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${stock.name}</td>
            <td contenteditable="true" oninput="updateStock(${index}, 'quantity', this.textContent)">${stock.quantity}</td>
            <td contenteditable="true" oninput="updateStock(${index}, 'wacc', this.textContent)">${stock.wacc}</td>
            <td contenteditable="true" oninput="updateStock(${index}, 'ltp', this.textContent)">${stock.ltp}</td>
            <td>${amount.toFixed(2)}</td>
            <td class="${profitLoss >= 0 ? 'profit' : 'loss'}">${profitLoss.toFixed(2)}</td>
            <td class="${profitLoss >= 0 ? 'profit' : 'loss'}">${plPercent.toFixed(2)}%</td>
            <td><button class="delete-btn" onclick="deleteStock(${index})">Delete</button></td>
        `;
        stockList.appendChild(row);
    });

    document.getElementById("currentValue").textContent = currentValue.toFixed(2);
    document.getElementById("totalPL").textContent = totalPL.toFixed(2);
    document.getElementById("currentInvestment").textContent = currentInvestment.toFixed(2);
    document.getElementById("totalProfitLoss").textContent = totalProfitLoss.toFixed(2);

    saveStocks();
}

// Update stock values when edited
function updateStock(index, field, value) {
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) return; // ignore invalid edits
    stocks[index][field] = val;
    displayStocks();
}

// Delete a stock from list
function deleteStock(index) {
    stocks.splice(index, 1);
    displayStocks();
}

// Sort stocks by name or by profit/loss
function sortStocks(field) {
    if (field === 'name') {
        stocks.sort((a, b) => a.name.localeCompare(b.name));
    } else if (field === 'profitLoss') {
        stocks.sort((a, b) => ((b.ltp - b.wacc) * b.quantity) - ((a.ltp - a.wacc) * a.quantity));
    }
    displayStocks();
}

// Fetch live LTP from API for each stock
async function fetchLiveLTP() {
    for (let stock of stocks) {
        try {
            const symbol = stock.name;
            const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://nepse-test.vercel.app/api?symbol=' + symbol)}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                console.warn("LT P fetch failed for:", symbol, resp.status);
                continue;
            }
            const data = await resp.json();
            // The JSON returns `current_price` field per API docs :contentReference[oaicite:2]{index=2}
            if (data.current_price !== undefined) {
                stock.ltp = parseFloat(data.current_price);
            }
        } catch (err) {
            console.error("Error fetching live LTP for", stock.name, err);
        }
    }
    displayStocks();
}

// Periodically update LTP every 5 seconds
setInterval(fetchLiveLTP, 5000);

// On page load
displayStocks();

