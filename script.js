let cüzdan = JSON.parse(localStorage.getItem('ekonomi_masasi_vFinal_PRO')) || { gelir: 0, islemler: [] };
let aktifSekme = 'harcama';
let myChart = null;

Chart.register(ChartDataLabels);

function hesaplaVeCiz() {
    const liste = document.getElementById('liste-container');
    liste.innerHTML = "";
    let tHarcama = 0; let tYatirim = 0;

    cüzdan.islemler.forEach(islem => {
        if (islem.tip === 'harcama') tHarcama += islem.miktar;
        else tYatirim += islem.miktar;
    });

    const sonGosterim = cüzdan.islemler.filter(i => i.tip === aktifSekme);
    [...sonGosterim].reverse().forEach((islem) => {
        const div = document.createElement('div');
        div.className = `kalem ${islem.tip}`;
        div.innerHTML = `<div><div style="font-weight:bold;">${islem.ad}</div><div style="font-size:10px; color:#444;">${islem.tarih}</div></div>
            <div style="display:flex; align-items:center; gap:12px;"><span style="font-weight:bold; color: ${islem.tip === 'harcama' ? '#ff3355' : '#3498db'}">${islem.miktar.toLocaleString()} TL</span><button onclick="islemSil('${islem.id}')" style="background:none; border:none; color:#444; cursor:pointer;">✕</button></div>`;
        liste.appendChild(div);
    });

    document.getElementById('net-kalan').innerText = (cüzdan.gelir - (tHarcama + tYatirim)).toLocaleString() + " TL";
    document.getElementById('toplam-yatirim').innerText = tYatirim.toLocaleString() + " TL";
    document.getElementById('toplam-harcama').innerText = tHarcama.toLocaleString() + " TL";
    document.getElementById('gelir-input').value = cüzdan.gelir || "";
    
    grafikGuncelle();
    localStorage.setItem('ekonomi_masasi_vFinal_PRO', JSON.stringify(cüzdan));
}

function grafikGuncelle() {
    const grafikKonteyner = document.getElementById('yatirim-grafik-konteyner');
    const yatirimlar = cüzdan.islemler.filter(i => i.tip === 'yatirim');

    if (aktifSekme === 'yatirim' && yatirimlar.length > 0) {
        grafikKonteyner.style.display = 'block';
        const gruplanmis = {};
        let toplamYatirimMik = 0;
        yatirimlar.forEach(y => {
            const ad = y.ad.toUpperCase();
            gruplanmis[ad] = (gruplanmis[ad] || 0) + y.miktar;
            toplamYatirimMik += y.miktar;
        });

        const labels = Object.keys(gruplanmis);
        const data = Object.values(gruplanmis);
        const renkler = ['#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c'];

        if (myChart) myChart.destroy();
        const ctx = document.getElementById('yatirimChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: renkler, borderWidth: 2, borderColor: '#111' }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value, ctx) => {
                            let p = (value * 100 / toplamYatirimMik).toFixed(1) + "%";
                            return ctx.chart.data.labels[ctx.dataIndex] + "\n" + p;
                        },
                        textAlign: 'center'
                    }
                }
            }
        });
        const lejand = document.getElementById('grafik-lejand');
        lejand.innerHTML = labels.map((l, i) => `<span><b style="color:${renkler[i % renkler.length]}">●</b> ${l} (%${(gruplanmis[l]*100/toplamYatirimMik).toFixed(1)})</span>`).join('');
    } else {
        grafikKonteyner.style.display = 'none';
    }
}

function gunlukRaporAc() {
    const val = document.getElementById('gunluk-tarih').value;
    if (!val) return;
    const [yil, ay, gun] = val.split('-');
    const filtre = cüzdan.islemler.filter(i => {
        const d = new Date(i.timestamp);
        return d.getFullYear() == yil && (d.getMonth()+1) == parseInt(ay) && d.getDate() == parseInt(gun);
    });
    raporuYeniSayfadaGoster(filtre, `${gun}.${ay}.${yil} Raporu`);
    document.getElementById('gunluk-tarih').value = "";
}

function aylikRaporAc() {
    const secilenAy = document.getElementById('ay-secici').value;
    if (secilenAy === "") return;
    const simdi = new Date();
    const filtre = cüzdan.islemler.filter(i => {
        const d = new Date(i.timestamp);
        return d.getMonth() == secilenAy && d.getFullYear() == simdi.getFullYear();
    });
    const ayIsmi = document.getElementById('ay-secici').options[document.getElementById('ay-secici').selectedIndex].text;
    raporuYeniSayfadaGoster(filtre, `${ayIsmi} Ayı Arşivi`);
    document.getElementById('ay-secici').value = "";
}

function donemRaporuAc(zaman) {
    const simdi = new Date();
    const filtre = cüzdan.islemler.filter(i => {
        const d = new Date(i.timestamp);
        if (zaman === 'hafta') {
            const birHaftaOnce = new Date(); birHaftaOnce.setDate(simdi.getDate() - 7);
            return d >= birHaftaOnce;
        }
        if (zaman === 'yil') return d.getFullYear() === simdi.getFullYear();
        return true;
    });
    raporuYeniSayfadaGoster(filtre, zaman === 'hafta' ? 'Haftalık Özet' : 'Yıllık Özet');
}

function raporuYeniSayfadaGoster(liste, baslik) {
    let harTop = 0; let yatTop = 0;
    liste.forEach(i => i.tip === 'harcama' ? harTop += i.miktar : yatTop += i.miktar);

    const html = `<html><head><title>${baslik}</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 10px; font-size: 20px; }
        .info-header { font-size: 11px; color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f4f4f4; }
        .Gider { color: #ff3355; font-weight: bold; }
        .Yatırım { color: #3498db; font-weight: bold; }
        .ozet-konteynir { width: 100%; border: 1px solid #ddd; border-top: none; padding: 10px 0; background: #fdfdfd; }
        .ozet-satir { display: flex; justify-content: flex-end; padding: 2px 15px; font-size: 14px; font-weight: bold; }
        .genel-toplam { margin-top: 5px; padding-top: 5px; border-top: 1px dashed #ccc; font-size: 16px; }
        @media print { body { padding: 0; } .ozet-konteynir { page-break-inside: avoid; } }
    </style></head>
    <body>
        <h1>📊 ${baslik}</h1>
        <div class="info-header">Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}</div>
        <table><thead><tr><th>Tarih</th><th>Açıklama</th><th>Tür</th><th>Miktar</th></tr></thead>
        <tbody>
            ${liste.map(i => `<tr><td>${i.tarih}</td><td>${i.ad}</td><td class="${i.tip === 'harcama' ? 'Gider' : 'Yatırım'}">${i.tip === 'harcama' ? 'Gider' : 'Yatırım'}</td><td>${i.miktar.toLocaleString()} TL</td></tr>`).join('')}
        </tbody></table>
        <div class="ozet-konteynir">
            <div class="ozet-satir"><span style="margin-right:20px;">TOPLAM GİDER:</span><span class="Gider">${harTop.toLocaleString()} TL</span></div>
            <div class="ozet-satir"><span style="margin-right:20px;">TOPLAM YATIRIM:</span><span class="Yatırım">${yatTop.toLocaleString()} TL</span></div>
            <div class="ozet-satir genel-toplam"><span style="margin-right:20px;">GENEL TOPLAM:</span><span>${(harTop + yatTop).toLocaleString()} TL</span></div>
        </div>
        <script>window.print();<\/script>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
}

function gelirGuncelle() {
    cüzdan.gelir = parseInt(document.getElementById('gelir-input').value) || 0;
    hesaplaVeCiz();
}

function kaydet() {
    const adIn = document.getElementById('islem-adi');
    const mikIn = document.getElementById('islem-miktar');
    if (adIn.value && mikIn.value) {
        cüzdan.islemler.push({ 
            id: Date.now().toString(), ad: adIn.value, miktar: parseInt(mikIn.value), 
            tip: aktifSekme, tarih: new Date().toLocaleString('tr-TR'), timestamp: new Date().getTime() 
        });
        adIn.value = ""; mikIn.value = "";
        hesaplaVeCiz();
    }
}

function sekmeDegistir(sekme) {
    aktifSekme = sekme;
    document.getElementById('sekme-harcama').classList.toggle('active', sekme === 'harcama');
    document.getElementById('sekme-yatirim').classList.toggle('active', sekme === 'yatirim');
    const btn = document.getElementById('btn-kaydet-islem');
    btn.innerText = sekme === 'harcama' ? '－ HARCAMAYI KAYDET' : '＋ YATIRIMI KAYDET';
    btn.style.background = sekme === 'harcama' ? '#ff3355' : '#3498db';
    hesaplaVeCiz();
}

function islemSil(id) { if(confirm("Silinsin mi?")) { cüzdan.islemler = cüzdan.islemler.filter(i => i.id !== id); hesaplaVeCiz(); } }

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (document.activeElement === document.getElementById('gelir-input')) gelirGuncelle();
        else if (document.activeElement === document.getElementById('islem-adi') || document.activeElement === document.getElementById('islem-miktar')) kaydet();
    }
});

hesaplaVeCiz();