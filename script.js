

const STORAGE_KEY = "catat_uang"; 

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentViewMonth = 'all'; 
let myChart = null; 

// --- FUNGSI UTAMA ---

let isSaldoVisible = true;

function toggleSaldoVisibility() {
    isSaldoVisible = !isSaldoVisible;
    updateBalanceDisplay();
    
    const eyeOpen = document.getElementById("eye-open");
    const eyeClosed = document.getElementById("eye-closed");
    
    // Pastikan kedua elemen ditemukan
    if (eyeOpen && eyeClosed) {
        if (isSaldoVisible) {
            eyeOpen.style.display = "block";
            eyeClosed.style.display = "none";
        } else {
            eyeOpen.style.display = "none";
            eyeClosed.style.display = "block";
        }
    }
}

function updateBalanceDisplay() {
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    if (isSaldoVisible) {
        document.getElementById("total-balance").innerText = `Rp ${balance.toLocaleString('id-ID')}`;
        document.getElementById("total-income").innerText = `+ Rp ${income.toLocaleString('id-ID')}`;
        document.getElementById("total-expense").innerText = `- Rp ${expense.toLocaleString('id-ID')}`;
    } else {
        document.getElementById("total-balance").innerText = "Rp •••••••";
        document.getElementById("total-income").innerText = "+ Rp •••••••";
        document.getElementById("total-expense").innerText = "- Rp •••••••";
    }
}

// Pastikan panggil updateBalanceDisplay() di dalam fungsi renderTable() & save()

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateMonthMenu(); 
    renderTable();
    updateBalanceDisplay(); // Tambahkan ini agar saldo selalu update otomatis
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
    
    // Tambahkan logika untuk memperbarui teks label
    const label = document.getElementById("month-label");
    if (val === 'all') {
        label.innerText = "Pengeluaran: Semua Bulan";
        label.style.color = "#ffffff";
    } else {
        const date = new Date(val + "-01");
        const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        label.innerText = `Pengeluaran: ${monthName}`;
        label.style.color = "#ffcc00";
    }
}

// Fungsi pembantu untuk memastikan warna label sesuai
function resetLabelStyle() {
    const label = document.getElementById("month-label");
    if (label) {
        label.innerText = "Pengeluaran : Semua Bulan";
        label.style.color = "#ffffff"; // Ubah menjadi putih
    }
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
    if(confirm("Yakin ingin menghapus semua data?")) {
        data = [];
        save(); // Karena save() sudah berisi updateBalanceDisplay(), ini akan beres
    }
}

function exportCSV() {
    let csv = "Tipe,Tanggal,Keterangan,Kategori,Nominal\n";
    data.forEach(t => csv += `${t.type},${t.d},${t.desc},${t.category},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `LaporanKeuangan_Yoshua.csv`;
    a.click();
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const text = e.target.result;
            // Pecah berdasarkan baris dan bersihkan baris kosong
            const lines = text.split(/\r?\n/);
            
            // Loop mulai dari baris ke-1 (skip header)
            const newData = [];
            for (let i = 1; i < lines.length; i++) {
                let row = lines[i].trim();
                if (!row) continue; // Skip baris kosong

                // Bersihkan tanda kutip " di awal/akhir
                let cleanRow = row.replace(/^"|"$/g, '').replace(/"/g, '');
                let values = cleanRow.split(',');

                // Pastikan ada minimal 5 kolom (Tipe, Tgl, Desc, Cat, Amt)
                if (values.length >= 5) {
                    newData.push({
                        id: Date.now() + Math.random(),
                        d: values[1] || new Date().toISOString().split('T')[0],
                        desc: values[2] || "Tanpa keterangan",
                        category: values[3] || "Lainnya",
                        amount: parseInt(String(values[4]).replace(/[^\d]/g, '')) || 0,
                        type: String(values[0]).toLowerCase().includes('in') ? 'income' : 'expense'
                    });
                }
            }

            data = [...data, ...newData];
            save(); 
            alert(`Sip! ${newData.length} data berhasil diimport.`);
            event.target.value = '';
        } catch (error) {
            console.error("Error Detail:", error);
            alert("Gagal Import: " + error.message);
        }
    };

    reader.readAsText(file);
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
updateBalanceDisplay();