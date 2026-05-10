let veriler = JSON.parse(localStorage.getItem('ekonomiVerileri')) || { bakiye: 0, islemler: [] };
let aktifSekme = 'harcama';

function verileriKaydet() { localStorage.setItem('ekonomiVerileri', JSON.stringify(veriler)); }

function setBakiye() {
    const input = document.getElementById('bakiye-input');
    const yeniBakiye = parseFloat(input.value);
    if (!isNaN(yeniBakiye)) {
        veriler.bakiye = yeniBakiye;
        input.value = '';
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function islemEkle() {
    const aciklama = document.getElementById('islem-aciklama').value;
    const miktar = parseFloat(document.getElementById('islem-miktar').value);
    if (aciklama && !isNaN(miktar)) {
        const yeniIslem = { id: Date.now(), aciklama, miktar, tur: aktifSekme, tarih: new Date().toLocaleString('tr-TR') };
        veriler.islemler.push(yeniIslem);
        document.getElementById('islem-aciklama').value = '';
        document.getElementById('islem-miktar').value = '';
        verileriKaydet();
        hesaplaVeCiz();
    }
}

function islemSil(id) {
    veriler.islemler = veriler.islemler.filter(i => i.id !== id);
    verileriKaydet();
    hesaplaVeCiz();
}

function sekmeDegistir(sekme) {
    aktifSekme = sekme;
    document.getElementById('sekme-harcama').classList.toggle('active', sekme === 'harcama');
    document.getElementById('sekme-yatirim').classList.toggle('active', sekme === 'yatirim');
    const btn = document.getElementById('btn-kaydet-islem');
    if (sekme === 'harcama') {
        btn.innerText = '－ HARCAMAYI KAYDET';
        btn.className = 'btn-kaydet harcama-modu';
    } else {
        btn.innerText = '＋ YATIRIMI KAYDET';
        btn.className = 'btn-kaydet yatirim-modu';
    }
}

function hesaplaVeCiz() {
    let toplamGider = 0, toplamYatirim = 0;
    const liste = document.getElementById('islem-listesi');
    liste.innerHTML = '';
    veriler.islemler.forEach(islem => {
        if (islem.tur === 'harcama') toplamGider += islem.miktar;
        else toplamYatirim += islem.miktar;
        const div = document.createElement('div');
        div.className = `kalem ${islem.tur}`;
        div.innerHTML = `<div><strong style="color:white">${islem.aciklama}</strong><br><small style="color:#444">${islem.tarih}</small></div>
            <div style="display:flex; align-items:center; gap:10px;"><span style="font-weight:bold; color:${islem.tur==='harcama'?'#ff3355':'#00ffa3'}">${islem.miktar.toLocaleString('tr-TR')} TL</span>
            <span onclick="islemSil(${islem.id})" style="color:#555; cursor:pointer; padding:5px;">✕</span></div>`;
        liste.prepend(div);
    });
    const netBakiye = veriler.bakiye - toplamGider;
    document.getElementById('net-bakiye').innerText = netBakiye.toLocaleString('tr-TR') + ' TL';
    document.getElementById('toplam-gider').innerText = toplamGider.toLocaleString('tr-TR') + ' TL';
    document.getElementById('toplam-yatirim').innerText = toplamYatirim.toLocaleString('tr-TR') + ' TL';
}

window.onload = function() { sekmeDegistir('harcama'); hesaplaVeCiz(); };