const STORAGE_KEY = "catat_uang"; 

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentViewMonth = 'all'; 
let myChart = null; 

// --- FUNGSI UTAMA ---

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateMonthMenu(); 
    renderTable();
}

function addTransaction() {
    const type = document.getElementById("type").value;
    const d = document.getElementById("date").value;
    const desc = document.getElementById("desc").value;
    const amount = Math.abs(parseInt(document.getElementById("amount").value));
    const category = document.getElementById("category").value;

    if (!d || !desc || isNaN(amount)) return alert("Mohon isi semua bidang!");

    data.push({ id: Date.now(), type, d, desc, amount, category });
    save();

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
}

function renderTable() {
    const list = document.getElementById("list");
    if (!list) return;
    
    list.innerHTML = "";
    
    data.sort((t1, t2) => new Date(t1.d) - new Date(t2.d));

    let exp = 0; 
    
    const filteredData = data.filter(t => currentViewMonth === "all" || t.d.startsWith(currentViewMonth));

    filteredData.forEach((t) => {
        const isExpense = t.type === 'expense';
        
        if (isExpense) exp += t.amount;

        list.innerHTML += `
            <tr>
                <td data-label="Tgl">${t.d.split('-').reverse().join('/')}</td>
                <td data-label="Keterangan">${t.desc}</td>
                <td data-label="Kategori"><small>${t.category}</small></td>
                <td data-label="Nominal" class="${isExpense ? 'text-red' : 'text-green'}">
                    ${isExpense ? '-' : '+'} Rp ${t.amount.toLocaleString('id-ID')}
                </td>
                <td data-label="Aksi">
                    <button class="btn btn-edit" onclick="edit(${t.id})">✏️</button>
                    <button class="btn btn-delete" onclick="hapus(${t.id})">🗑️</button>
                </td>
            </tr>`;
    });

    // UPDATE: Hanya update angka pengeluaran
    const expElement = document.getElementById("total-expense");
    if (expElement) {
        expElement.innerText = `Rp ${exp.toLocaleString('id-ID')}`;
    }

    updateChart(filteredData);
}

// --- FITUR MENU BURGER (DINAMIS) ---

function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");
    
    sideMenu.classList.toggle("active");
    
    overlay.classList.toggle("active");
}

function updateMonthMenu() {
    const monthList = document.getElementById("monthList");
    if (!monthList) return;

    monthList.innerHTML = `<div class="month-item" onclick="filterByMonth('all')">Semua Bulan</div>`;

    // Ambil bulan unik dari data yang ada saja
    const availableMonths = [...new Set(data.map(t => t.d.substring(0, 7)))];
    availableMonths.sort().reverse();

    availableMonths.forEach(m => {
        const date = new Date(m + "-01");
        const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        monthList.innerHTML += `
            <div class="month-item" onclick="filterByMonth('${m}')">
                ${monthName}
            </div>
        `;
    });
}

function filterByMonth(val) {
    currentViewMonth = val;
    toggleMenu(); 
    renderTable();
}

// --- FITUR EDIT, HAPUS & IMPORT/EXPORT ---

function edit(id) {
    const index = data.findIndex(x => x.id === id);
    if (index === -1) return;
    const t = data[index];

    const nDesc = prompt("Ubah Keterangan:", t.desc);
    if (nDesc === null) return;
    const nAmt = prompt("Ubah Nominal:", t.amount);
    if (nAmt === null) return;

    const parsedAmount = Math.abs(parseInt(nAmt));
    if (nDesc.trim() !== "" && !isNaN(parsedAmount)) {
        data[index].desc = nDesc;
        data[index].amount = parsedAmount;
        save();
    }
}

function hapus(id) {
    if (confirm("Hapus transaksi ini?")) {
        data = data.filter(x => x.id !== id);
        save();
    }
}

function clearAllData() {
    if (confirm("Hapus SEMUA data?")) {
        data = [];
        save();
    }
}

function exportCSV() {
    let csv = "Tipe,Tanggal,Keterangan,Kategori,Nominal\n";
    data.forEach(t => csv += `${t.type},${t.d},${t.desc},${t.category},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Keuangan_Yoshua.csv`;
    a.click();
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUint8 = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataUint8, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const importedData = [];

        for (let i = 1; i < rawJson.length; i++) {
            const row = rawJson[i];
            if (!row || row.length === 0) continue;
            let finalData = {};
            if (row.length === 1 && typeof row[0] === 'string') {
                const cols = row[0].split(',');
                finalData = { d: cols[0], desc: cols[1], category: cols[2], amount: parseInt(cols[3]), type: 'expense' };
            } else {
                finalData = { d: row[0], desc: row[1], category: row[2], amount: parseInt(row[3]), type: 'expense' };
            }
            if (finalData.d && !isNaN(finalData.amount)) {
                finalData.id = Date.now() + Math.random();
                importedData.push(finalData);
            }
        }
        data = [...data, ...importedData];
        save();
    };
    reader.readAsArrayBuffer(file);
}

function updateChart(filteredData) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    if (myChart) myChart.destroy();

    const expensesOnly = filteredData.filter(t => t.type === 'expense');
    const cats = {};
    expensesOnly.forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);

    if (expensesOnly.length === 0) return;

    myChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- JALANKAN SAAT START ---
updateMonthMenu();
renderTable();