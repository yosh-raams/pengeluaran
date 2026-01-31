let data = JSON.parse(localStorage.getItem("expenses_final")) || [];
let myChart = null;

document.getElementById("date").valueAsDate = new Date();

function save() {
    localStorage.setItem("expenses_final", JSON.stringify(data));
    initFilter();
    renderTable();
}

function addTransaction() {
    const d = document.getElementById("date").value;
    const desc = document.getElementById("desc").value;
    const amount = Math.abs(parseInt(document.getElementById("amount").value));
    const category = document.getElementById("category").value;

    if (!d || !desc || isNaN(amount)) return alert("Lengkapi data dulu!");

    data.push({ id: Date.now(), d, desc, amount, category });
    save();
    
    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
}

function renderTable() {
    const list = document.getElementById("list");
    const filter = document.getElementById("filterMonth").value;
    list.innerHTML = "";
    let total = 0;

    const filteredData = data.filter(t => filter === "all" || t.d.startsWith(filter));

    filteredData.forEach((t, i) => {
        total += t.amount;
        list.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${t.d}</td>
                <td>${t.desc}</td>
                <td>${t.category}</td>
                <td style="color:red; font-weight:bold">Rp ${t.amount.toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn btn-edit" onclick="edit(${t.id})">Edit</button>
                    <button class="btn btn-delete" onclick="hapus(${t.id})">Hapus</button>
                </td>
            </tr>`;
    });

    document.getElementById("summary").innerText = `Total: Rp ${total.toLocaleString('id-ID')}`;
    updateChart(filteredData);
}

function updateChart(filteredData) {
    const categories = {};
    filteredData.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) myChart.destroy();

    if (filteredData.length === 0) return; // Jangan gambar kalau data kosong

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#dc3545', '#1a73e8', '#ffc107', '#28a745', '#6f42c1', '#fd7e14']
            }]
        },
        options: {
            plugins: {
                title: { display: true, text: 'Grafik Pengeluaran' }
            }
        }
    });
}

function edit(id) {
    const t = data.find(x => x.id === id);
    const nDesc = prompt("Keterangan baru:", t.desc);
    const nAmt = prompt("Nominal baru:", t.amount);
    if (nDesc && nAmt) {
        t.desc = nDesc;
        t.amount = Math.abs(parseInt(nAmt));
        save();
    }
}

function hapus(id) {
    if (confirm("Hapus?")) {
        data = data.filter(x => x.id !== id);
        save();
    }
}

function initFilter() {
    const f = document.getElementById("filterMonth");
    const current = f.value;
    const months = [...new Set(data.map(t => t.d.slice(0, 7)))].sort().reverse();
    f.innerHTML = '<option value="all">Semua Bulan</option>';
    months.forEach(m => f.innerHTML += `<option value="${m}" ${current === m ? 'selected' : ''}>${m}</option>`);
}

function exportCSV() {
    let csv = "Tanggal,Keterangan,Kategori,Nominal\n";
    data.forEach(t => csv += `${t.d},${t.desc},${t.category},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pengeluaran.csv";
    a.click();
}

renderTable();