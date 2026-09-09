# Bunda Math

Website: [https://hasimiali.github.io/bunda-math-drill/](https://hasimiali.github.io/bunda-math-drill/)

Bunda Math adalah permainan aritmatika mental berbahasa Indonesia. Pemain
mendengarkan rangkaian angka, menghitung di dalam kepala, lalu memasukkan hasil
akhir untuk mendapatkan skor dan rincian latihan.

Semua pemrosesan berlangsung di browser. File latihan tidak diunggah ke server.

## Fitur

- Suara Indonesia melalui Web Speech API browser
- Sinkronisasi tampilan dengan akhir pengucapan setiap angka
- Mode visual otomatis jika suara tidak tersedia
- Tiga paket contoh kurasi: `Santai`, `Fokus`, dan `Juara`
- Impor `.csv`, `.xlsx`, dan `.xlsm` langsung di browser
- Ulangi rangkaian, penilaian otomatis, dan dua mode umpan balik
- Mode guru untuk drill kelas tanpa input jawaban atau skor individual
- Ekspor rincian hasil sebagai CSV
- Antarmuka responsif untuk desktop, tablet, dan ponsel
- Wizard pengaturan dan ringkasan berhalaman tanpa scroll horizontal/vertikal
- Tailwind CSS v4 dengan komponen shadcn/ui berbasis Radix UI

## Pengembangan lokal

Persyaratan: Node.js 22 atau versi LTS terbaru.

```powershell
npm install
npm run dev
```

Pemeriksaan proyek:

```powershell
npm run lint
npm test
npm run build
npm run preview
```

## Struktur UI

Tailwind CSS dikonfigurasi melalui plugin Vite di `vite.config.ts`. Token warna,
font, dan animasi Bunda Math berada di `src/styles.css`, sedangkan layout dan
responsive styling menggunakan utility class langsung pada komponen React.

Komponen shadcn/ui yang dimiliki proyek berada di `src/components/ui/`. Komponen
tersebut menggunakan Radix UI untuk perilaku interaktif dan aksesibilitas, serta
`src/lib/utils.ts` untuk penggabungan class Tailwind. Konfigurasi registry berada
di `components.json` sehingga komponen tambahan dapat dibuat dengan CLI shadcn.

```powershell
npx shadcn@latest add tooltip
```

## Format soal

Setiap kolom spreadsheet adalah satu soal. Setiap baris berisi angka berikutnya
dalam rangkaian. Header teks dan sel kosong akan dilewati.

```csv
3,5,7
-7,2,-3
8,9,6
10,-1,2
```

Contoh tersebut menghasilkan tiga soal. Tiga paket siap pakai tersedia di:

- `public/examples/santai.csv`: 4 angka dengan nilai kecil
- `public/examples/fokus.csv`: 5 angka dengan operasi campuran
- `public/examples/juara.csv`: 7 angka dengan tantangan lebih intensif

Ketiganya dapat dipilih langsung melalui menu **Paket contoh** atau diunduh dari
bagian bawah halaman utama.

Nama Santai, Fokus, dan Juara hanya nama paket contoh. Aplikasi tidak mengubah
atau membuat tingkat kesulitan secara otomatis. Isi, jumlah angka per soal, dan
jumlah soal sepenuhnya mengikuti paket contoh atau file CSV/Excel yang dipilih.

## Suara browser

Bunda Math memilih suara dengan locale `id-ID` atau `id` bila tersedia. Daftar
suara bergantung pada browser dan sistem operasi. Microsoft Edge di Windows dan
Chrome di Android biasanya menyediakan suara Indonesia berkualitas baik.

Jika suara Indonesia tidak terpasang, pengguna dapat memilih suara lain yang
disediakan perangkat atau menonaktifkan suara. Mode visual tidak membutuhkan
internet maupun backend.

## Mode latihan

- **Mode Murid** meminta pemain mengisi jawaban, kemudian menghitung skor dan
  menampilkan rincian performa.
- **Mode Guru** berhenti setelah setiap rangkaian agar beberapa murid dapat
  menjawab secara lisan. Guru dapat mengulang soal, melihat atau menyembunyikan
  kunci, dan melanjutkan ke soal berikutnya. Kunci hanya ditampilkan dan tidak
  dibacakan.

Pada mode guru, `Space` mengulang rangkaian dan `Enter` melanjutkan soal. Setelah
drill selesai, aplikasi menampilkan seluruh rangkaian beserta kuncinya dan dapat
mengekspor kunci sebagai CSV. Tidak ada data atau penilaian murid yang disimpan.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` menguji dan membangun aplikasi,
lalu menerbitkan folder `dist` ke GitHub Pages.

1. Buat repository GitHub dan push proyek ini ke branch `main` atau `master`.
2. Workflow akan mencoba mengaktifkan Pages dengan sumber **GitHub Actions**.
3. Jika aktivasi otomatis dibatasi oleh pengaturan akun, buka **Settings > Pages**
   dan atur **Source** menjadi **GitHub Actions**.
4. Jalankan workflow **Deploy to GitHub Pages** atau push commit baru.

Vite memakai base path relatif, jadi aplikasi dapat diterbitkan pada project
Pages tanpa mengubah nama repository di konfigurasi.

## Desktop lama

Versi Python/Tkinter sebelumnya disimpan di `legacy/desktop/`. Versi tersebut
tidak digunakan oleh website atau workflow GitHub Pages.
