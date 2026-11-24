# Makmal Transformasi — versi penerokaan langsung

## Buka simulasi

Buka `Simulasi-Transformasi.html` dalam pelayar moden. Ia satu fail lengkap dan berfungsi tanpa internet; hanya pautan rujukan memerlukan internet. Folder `simulasi-transformasi` mengandungi versi fail berasingan untuk suntingan (`index.html`, `styles.css`, `math.js`, `app.js`).

## Gerakkan objek pada grid

- Pilih mod Titik atau Poligon. Tujuh bentuk permulaan disediakan: segi tiga, segi empat sama, segi empat tepat, segi empat selari, trapezium, pentagon dan heksagon. Pentagon dan heksagon contoh bukan poligon sekata.
- **Tarik bucu** untuk mengubah bentuk. **Tekan dan seret isi poligon** untuk mengalih seluruh objek sambil mengekalkan bentuknya.
- Magnet menetapkan bucu dan alihan pada **0.5 unit**, termasuk simpang unit penuh. Garis halus menunjukkan separuh unit apabila zum mencukupi. Snap kekal aktif walaupun grid dizum keluar.
- Koordinat bucu di sebelah kiri ialah bacaan langsung, tanpa kotak edit. Klik bacaan bucu dan gunakan kekunci anak panah untuk mengalih bucu itu sebanyak 0.5 unit. Empat butang anak panah mengalih seluruh objek.
- Seretan yang menyebabkan poligon bersilang, bucu bertindih atau luas sifar ditolak; kedudukan terakhir yang sah dikekalkan.
- Grid tidak mengubah zum atau kedudukan secara automatik ketika menyeret. Gunakan Zum masuk/keluar, alat Gerakkan grid dan Muatkan semua jika bentuk keluar daripada pandangan.
- Gunakan pilihan Alat untuk membezakan objek dan imej bertindih. Kotak paparan membolehkan objek atau imej disembunyikan sementara.

## Transformasi tunggal dan gabungan

Tab **Tunggal** di kiri dan **Gabungan** di kanan memilih satu atau maksimum dua transformasi. Dalam gabungan, pilih butang P atau Q untuk mengubah transformasi berkenaan. P dilakukan dahulu, kemudian Q; notasinya **QP**. Jenis yang sama boleh digunakan dua kali.

Semua koordinat, imej, luas dan pengiraan dikemas kini serta-merta. Tiada butang Play atau urutan video. Mengubah P turut mengubah imej akhir QP. Butang Tukar tertib menukar parameter P dan Q.

### Translasi

Tetapkan vektor atau seret imejnya. Seretan imej melaras vektor, sementara objek masukannya kekal di koordinat yang sama.

### Pantulan

Tekan **Lukis garis pantulan**, kemudian tekan dan seret antara dua kedudukan pada grid. Hujung garis melekat pada simpang 0.5 unit. Garis cermin memanjang tanpa had; segmen yang dilukis hanya menentukan arah dan kedudukannya.

Selepas dilukis, seret pemegang L₁ atau L₂ untuk mengubah arah garis. Seret bahagian garis yang tidak dilindungi bentuk untuk mengalihkannya. Gunakan alat Pilih & seret. Persamaan garis dipaparkan di panel transformasi dan keterangan bawah grid. Pecahan digunakan apabila sesuai supaya kecerunan garis bebas kekal tepat.

Garis biasa x = c, y = c, y = x dan y = −x turut disediakan. Paksi-x ialah y = 0; paksi-y ialah x = 0. Dua hujung tidak boleh bertepatan. Escape membatalkan lukisan.

Imej pantulan dikawal oleh garis cermin. Untuk mengekalkan pantulan yang sah, imejnya tidak dialih secara bebas daripada garis itu.

### Pembesaran

Tekan **Pilih pusat pada grid**, kemudian klik pusat yang dikehendaki. Pusat boleh diseret lagi. Tetapkan k menggunakan nombor atau pilihan pantas. k boleh negatif atau pecahan perpuluhan, antara −10 dan 10, bukan sifar.

Tekan **Seret imej pada grid**, kemudian seret isi imej atau titik imej. Pusat dikira semula supaya faktor skala dan objek masukannya kekal. Jika imej dialih Δ, pusat berubah sebanyak Δ / (1 − k). Oleh itu, pusat terbitan mungkin bukan gandaan 0.5 walaupun alihan imej ialah gandaan 0.5.

**k = 1:** imej sama dengan objek dan tidak boleh dialih dengan mengubah pusat. Seret objek asal atau ubah k dahulu. k = 0 dikecualikan kerana meruntuhkan poligon kepada satu titik.

### Putaran

Pilih pusat dengan klik atau seret pusat. Laraskan sudut dengan gelongsor (langkah 15°), input nombor (−360° hingga 360°) atau pilihan pantas 90°/180°. Sudut positif ialah lawan arah jam; sudut negatif ialah ikut arah jam.

Seret imej untuk mengubah pusat sambil mengekalkan sudut dan objek masukannya. Pusat baharu diselesaikan menggunakan persamaan (I − R)Δpusat = Δimej. Ia boleh mempunyai koordinat pecahan.

Putaran 0° atau gandaan 360° menghasilkan imej yang sama dengan objek; mengubah pusat tidak dapat mengalih imej itu. Putaran yang terlalu hampir kepada identiti turut dilindungi daripada pengiraan pusat yang tidak stabil.

## Kemudahan lain

- **Undur / ulang:** sehingga 60 tindakan; satu seretan dikira satu tindakan. Ctrl+Z dan Ctrl+Shift+Z turut disokong apabila fokus bukan pada input nombor.
- **Escape:** batalkan seretan, lukisan atau pemilihan pusat yang sedang berjalan.
- **Pengiraan setiap titik:** pilih bucu A, B, C dan seterusnya. Pengiraan gabungan menggunakan imej pertama sebagai objek masuk untuk transformasi kedua.
- **Muatkan semua:** muatkan objek, imej dan pusat dalam pandangan yang sama. Semua petak mempunyai skala x dan y yang sama.
- Garis penghubung ialah panduan titik sepadan, bukan lintasan putaran.
- Koordinat paparan dibundarkan kepada maksimum tiga tempat perpuluhan. Enjin menggunakan nilai penuh; tanda ≈ digunakan dalam nilai pengiraan yang dibundarkan. Input nombor menggunakan perpuluhan, misalnya 0.25 untuk 1/4. Keadaan tidak disimpan selepas halaman dimuat semula.

## Masukkan ke website

Muat naik `Simulasi-Transformasi.html` ke website dan benamkan:

```html
<iframe
  src="/Simulasi-Transformasi.html"
  title="Makmal Transformasi Matematik Tingkatan 5"
  style="width:100%;height:1200px;border:0;"
  loading="lazy">
</iframe>
```

Atau muat naik keseluruhan folder fail berasingan dan gunakan `/simulasi-transformasi/index.html` sebagai `src`. Ubah tinggi iframe mengikut reka letak website. iframe mengasingkan gaya simulasi daripada halaman induk. Tiada akaun, pangkalan data, API atau pemasangan pakej diperlukan.

## Enjin matematik

`window.TransformMath` menyediakan `transform`, `stages`, `area`, `snap`, `lineCoefficients`, `moveImage` dan `polygonValid`. Enjin juga boleh digunakan melalui `require()` untuk semakan setempat. Had dua transformasi dikuatkuasakan oleh antara muka.

Pantulan bebas menggunakan garis Ax + By + C = 0. Dengan d = (Ax + By + C)/(A² + B²), imej ialah (x − 2Ad, y − 2Bd). d ialah nilai perantaraan, bukan jarak serenjang. Pembesaran menggunakan (h + k(x − h), v + k(y − v)). Luas imej ialah k² darab luas objek. Putaran menggunakan matriks putaran di sekitar pusat yang dipilih. Luas poligon ringkas menggunakan formula shoelace.

## Rujukan dan skop

- [DSKP KPM Matematik Tingkatan 4 dan 5 KSSM](https://bukuteksdigital.my/wp-content/uploads/2020/06/DSKP-MATEMATIK-Tingkatan-4-DAN-Tingkatan-5-KSSM.pdf), halaman bercetak 99–100, standard 5.2 dan 5.3.
- [Buku Teks KPM Matematik Tingkatan 5 KSSM](https://ecentral.my/wp-content/uploads/2025/06/Buku-Teks-Matematik-Tingkatan-5-KSSM.pdf), Bab 5 (salinan digital).

Aktiviti ini meneroka imej, koordinat, luas dan tertib transformasi. Garis pantulan bebas dan sudut putaran boleh laras menyokong penerokaan lebih luas. Ia tidak merangkumi keseluruhan Bab 5, teselasi atau semua jenis soalan SPM.

## Pengesahan versi ini

87 semakan matematik terdahulu serta 327 semakan tambahan lulus. Semakan tambahan meliputi pantulan bebas/menegak/mendatar, titik tengah pada garis cermin, keserenjangan, luas, snap 0.5, pusat terbitan seretan imej untuk pelbagai faktor skala dan sudut, kes identiti dan gabungan selepas seretan. Ujian pelayar meliputi seretan bucu separuh unit, seretan keseluruhan poligon, undur, lukisan cermin condong, pemilihan pusat, seretan imej pembesaran dan putaran, perubahan faktor selepas seretan, mod titik dan tab gabungan. Ini bukan pengesahan setiap peranti atau pelayar.
