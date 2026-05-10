let veriler = JSON.parse(localStorage.getItem('eko_vFinal_Master')) || { bakiye: 0, islemler: [] };
let aktifSekme = 'harcama';
let myChart = null;

function verileriKaydet() { localStorage.setItem('eko_vFinal_Master', JSON.stringify(veriler)); }

function handleEnter(event, func) {
    if (event.key === "Enter") {
        event.preventDefault();
        if (func === 'setGelir') setGelir();
        if (func === 'islemEkle') islemEkle();
    }
}

function setGelir() {
    const input = document.getElementById('gelir-input');
    const miktar = parseFloat(input.value);
    if (!isNaN(miktar)) {
        veriler.bakiye = miktar;
        input.value = "";
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function islemEkle() {
    const acikInput = document.getElementById('islem-aciklama');
    const mikInput = document.getElementById('islem-miktar');
    const miktar = parseFloat(mikInput.value);
    if (acikInput.value && !isNaN(miktar)) {
        const simdi = new Date();
        veriler.islemler.push({
            id: Date.now(),
            aciklama: acikInput.value,
            miktar: miktar,
            tur: aktifSekme,
            tarih: simdi.toLocaleDateString('tr-TR'),
            ay: simdi.getMonth(),
            tamTarih: simdi.toISOString().split('T')[0]
        });
        acikInput.value = ""; mikInput.value = "";
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function islemSil(id) {
    if(confirm("Silmek istediğine emin misin?")) {
        veriler.islemler = veriler.islemler.filter(i => i.id !== id);
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function sekmeDegistir(s) {
    aktifSekme = s;
    document.getElementById('sekme-harcama').classList.toggle('active', s === 'harcama');
    document.getElementById('sekme-yatirim').classList.toggle('active', s === 'yatirim');
    document.getElementById('btn-kaydet').className = `btn-kaydet ${s}-modu`;
    hesaplaVeCiz();
}

function grafikCiz(yatirimlar) {
    const grafikAlani = document.getElementById('grafik-alani');
    if (yatirimlar.length === 0 || aktifSekme !== 'yatirim') {
        grafikAlani.style.display = 'none';
        return;
    }
    grafikAlani.style.display = 'block';
    const gruplanmis = {};
    yatirimlar.forEach(y => {
        const isim = y.aciklama.toUpperCase();
        gruplanmis[isim] = (gruplanmis[isim] || 0) + y.miktar;
    });
    const etiketler = Object.keys(gruplanmis);
    const degerler = Object.values(gruplanmis);
    const toplam = degerler.reduce((a, b) => a + b, 0);

    if (myChart) myChart.destroy();
    const ctx = document.getElementById('yatirimChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: etiketler.map((l, i) => l + " (%" + ((degerler[i]/toplam)*100).toFixed(0) + ")"),
            datasets: [{
                data: degerler,
                backgroundColor: ['#00ffa3', '#d4af37', '#00d4ff', '#ff3355', '#a300ff'],
                borderWidth: 1, borderColor: '#111'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#ccc', font: { size: 10 } } } }
        }
    });
}

function filtreleVeYazdir() {
    hesaplaVeCiz();
    const ay = document.getElementById('ay-filtre').value;
    const tarih = document.getElementById('tarih-filtre').value;
    if (ay !== 'all' || tarih !== "") {
        setTimeout(() => { window.print(); }, 500);
    }
}

function hesaplaVeCiz() {
    const secilenAy = document.getElementById('ay-filtre').value;
    const tarihFiltre = document.getElementById('tarih-filtre').value;
    const ekranListe = document.getElementById('ekran-liste');
    const pGiderList = document.getElementById('print-harcama-listesi');
    const pYatirimList = document.getElementById('print-yatirim-listesi');

    ekranListe.innerHTML = ""; pGiderList.innerHTML = ""; pYatirimList.innerHTML = "";
    let tGider = 0, tYatirim = 0; let grafikYatirimlar = [];

    veriler.islemler.forEach(i => {
        const ayUygun = (secilenAy === 'all' || i.ay == secilenAy);
        const tarihUygun = (tarihFiltre === "" || i.tamTarih === tarihFiltre);
        if (ayUygun && tarihUygun) {
            const html = `<div class="kalem ${i.tur}"><div><strong>${i.aciklama}</strong><br><small>${i.tarih}</small></div><div><b>${i.miktar.toLocaleString()} TL</b> <span class="sil-btn no-print" onclick="islemSil(${i.id})">✖</span></div></div>`;
            if (i.tur === 'harcama') { tGider += i.miktar; pGiderList.innerHTML += html; }
            else { tYatirim += i.miktar; pYatirimList.innerHTML += html; grafikYatirimlar.push(i); }
            if (i.tur === aktifSekme) ekranListe.innerHTML += html;
        }
    });

    grafikCiz(grafikYatirimlar);
    const net = (veriler.bakiye) - (tGider + tYatirim);
    
    document.getElementById('net-bakiye').innerText = net.toLocaleString() + " TL";
    document.getElementById('toplam-gider').innerText = tGider.toLocaleString() + " TL";
    document.getElementById('toplam-yatirim').innerText = tYatirim.toLocaleString() + " TL";
    
    document.getElementById('p-gelir').innerText = veriler.bakiye.toLocaleString() + " TL";
    document.getElementById('p-gider').innerText = tGider.toLocaleString() + " TL";
    document.getElementById('p-yatirim').innerText = tYatirim.toLocaleString() + " TL";
    document.getElementById('p-net').innerText = net.toLocaleString() + " TL";
}

window.onload = hesaplaVeCiz;