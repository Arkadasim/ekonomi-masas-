let veriler = JSON.parse(localStorage.getItem('eko_master_vFinal')) || { bakiye: 0, islemler: [] };
let aktifSekme = 'harcama';

function verileriKaydet() { localStorage.setItem('eko_master_vFinal', JSON.stringify(veriler)); }

function handleEnter(event, func) {
    if (event.key === "Enter") {
        event.preventDefault();
        if (func === 'setGelir') setGelir();
        if (func === 'islemEkle') islemEkle();
    }
}

function setGelir() {
    const input = document.getElementById('gelir-input');
    if (input && input.value !== "") {
        veriler.bakiye = parseFloat(input.value);
        input.value = "";
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function islemEkle() {
    const acikInput = document.getElementById('islem-aciklama');
    const mikInput = document.getElementById('islem-miktar');
    if (acikInput && mikInput && acikInput.value && mikInput.value) {
        const simdi = new Date();
        veriler.islemler.push({
            id: Date.now(),
            aciklama: acikInput.value,
            miktar: parseFloat(mikInput.value),
            tur: aktifSekme,
            tarih: simdi.toLocaleDateString('tr-TR'),
            saat: simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            ay: simdi.getMonth(),
            tamTarih: simdi.toISOString().split('T')[0]
        });
        acikInput.value = ""; 
        mikInput.value = "";
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

function filtreleVeYazdir() {
    hesaplaVeCiz(); 
    const ayElem = document.getElementById('ay-filtre');
    const tarihElem = document.getElementById('tarih-filtre');
    
    if ((ayElem && ayElem.value !== 'all') || (tarihElem && tarihElem.value !== "")) {
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

function hesaplaVeCiz() {
    const ayFiltreElem = document.getElementById('ay-filtre');
    const secilenAy = ayFiltreElem ? ayFiltreElem.value : 'all';
    const tarihFiltreElem = document.getElementById('tarih-filtre');
    const tarihFiltre = tarihFiltreElem ? tarihFiltreElem.value : "";
    
    const ekranListe = document.getElementById('ekran-liste');
    const pGiderList = document.getElementById('print-harcama-listesi');
    const pYatirimList = document.getElementById('print-yatirim-listesi');
    const pInfo = document.getElementById('print-info');

    if(!ekranListe || !pGiderList || !pYatirimList) return;

    ekranListe.innerHTML = ""; pGiderList.innerHTML = ""; pYatirimList.innerHTML = "";
    let tGider = 0, tYatirim = 0;

    if (tarihFiltre) {
        pInfo.innerText = "Tarih: " + tarihFiltre.split('-').reverse().join('.');
    } else if (secilenAy !== 'all') {
        const aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
        pInfo.innerText = aylar[secilenAy] + " Ayı Raporu";
    } else {
        pInfo.innerText = "Genel Rapor";
    }

    veriler.islemler.forEach(i => {
        const ayUygun = (secilenAy === 'all' || i.ay == secilenAy);
        const tarihUygun = (tarihFiltre === "" || i.tamTarih === tarihFiltre);
        if (ayUygun && tarihUygun) {
            const html = `<div class="kalem ${i.tur}"><div><strong>${i.aciklama}</strong><br><small>${i.tarih} - ${i.saat}</small></div><div><b>${i.miktar.toLocaleString('tr-TR')} TL</b> <span class="sil-btn no-print" onclick="islemSil(${i.id})">✖</span></div></div>`;
            if (i.tur === 'harcama') { tGider += i.miktar; pGiderList.innerHTML += html; }
            else { tYatirim += i.miktar; pYatirimList.innerHTML += html; }
            if (i.tur === aktifSekme) ekranListe.innerHTML += html;
        }
    });

    const net = (veriler.bakiye || 0) - (tGider + tYatirim);
    document.getElementById('net-bakiye').innerText = net.toLocaleString('tr-TR') + " TL";
    document.getElementById('toplam-gider').innerText = tGider.toLocaleString('tr-TR') + " TL";
    document.getElementById('toplam-yatirim').innerText = tYatirim.toLocaleString('tr-TR') + " TL";
    document.getElementById('p-gelir').innerText = (veriler.bakiye || 0).toLocaleString('tr-TR') + " TL";
    document.getElementById('p-gider').innerText = tGider.toLocaleString('tr-TR') + " TL";
    document.getElementById('p-yatirim').innerText = tYatirim.toLocaleString('tr-TR') + " TL";
    document.getElementById('p-net').innerText = net.toLocaleString('tr-TR') + " TL";
}

window.onload = hesaplaVeCiz;