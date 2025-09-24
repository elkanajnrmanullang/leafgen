<p align="center">
  <img src="./assets/logo.png" alt="LeafGenn Logo" width="128">
</p>


<p align="center">
  <strong>Sistem Otomatisasi Desain Leaflet Promosi Berbasis Web</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-in_development-yellow" alt="Status Proyek">
  <img src="https://img.shields.io/badge/Laravel-v11.x-FF2D20?logo=laravel" alt="Laravel">
  <img src="https://img.shields.io/badge/React-v18.x-20232A?logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

Berkas README ini memberikan semua informasi yang Anda butuhkan untuk memahami, menginstal, dan menjalankan proyek LeafGenn.

### ## Daftar Isi
1. [Deskripsi Proyek](#-deskripsi-proyek)
2. [Fitur Utama](#-fitur-utama)
3. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
4. [Persyaratan](#-persyaratan)
5. [Panduan Instalasi](#-panduan-instalasi)
6. [Penggunaan](#-penggunaan)
7. [Pemecahan Masalah](#-pemecahan-masalah-troubleshooting)
8. [Lisensi](#-lisensi)
9. [Kontak](#-kontak)

---

### ## 📄 Deskripsi Proyek
LeafGenn adalah aplikasi web yang dirancang untuk merombak total proses pembuatan leaflet promosi di industri ritel. Sistem ini bertujuan untuk mengatasi alur kerja manual yang lambat dan rentan terhadap *human error*. Dengan mengotomatisasi proses dari data CSV hingga output visual, LeafGenn bertujuan memangkas waktu kerja dari **8+ jam** menjadi **kurang dari 1 jam**, sekaligus meningkatkan efisiensi dan akurasi data.

---

### ## ✨ Fitur Utama
- **🔐 Otentikasi & RBAC:** Sistem login aman dengan dua level pengguna (Manager & Staff).
- **📄 Alur Kerja Berbasis CSV:** Proses utama pembuatan leaflet dimulai dengan mengunggah file CSV.
- **🖼️ Bank Gambar Terpusat:** Manajemen data produk (PLU, nama, gambar) dalam satu database.
- **🎨 Editor Visual Interaktif:** Antarmuka "Canva-like" untuk menggeser (*drag-and-drop*) dan menyesuaikan posisi layout produk.
- **🖌️ Template Desain Latar:** Perpustakaan untuk menyimpan dan menggunakan kembali desain latar belakang.
- **📜 Manajemen History:** Semua leaflet yang dibuat tersimpan, lengkap dengan fitur pratinjau, unduh ulang, dan revisi cepat.
- **⚙️ Manajemen Akun:** Fitur khusus Manager untuk menambah dan menonaktifkan akun pengguna.

---

### ## 🚀 Teknologi yang Digunakan
* **Backend:** Laravel
* **Frontend:** React (Vite + TypeScript)
* **Database:** PostgreSQL
* **Styling:** Tailwind CSS
* **Server & Deployment:** VPS Ubuntu, Nginx, Supervisor

---

### ## 📋 Persyaratan
Sebelum memulai, pastikan perangkat lunak berikut sudah terinstal di komputer Anda:
- **VSCode** (atau editor kode pilihan)
- **Server Lokal** (XAMPP, Laragon, Herd)
- **Composer 2.x**
- **Node.js 18.x** atau lebih baru
- **Klien Database** (DBeaver, pgAdmin)

---

### ## 🏁 Panduan Instalasi
Berikut adalah langkah-langkah untuk menjalankan proyek ini di lingkungan development.

#### **1. Setup Proyek Awal**
Di terminal, jalankan perintah berikut dari direktori kerja Anda:
```bash
# Buat folder utama dan masuk ke dalamnya
mkdir leafgen
cd leafgen

# Buat proyek Laravel di dalam folder 'backend'
composer create-project laravel/laravel backend

# Buat proyek React di dalam folder 'frontend'
npm create vite@latest frontend -- --template react-ts