# Panduan Kontribusi

## Alur kerja lokal

1. Buat perubahan kecil yang memiliki tujuan jelas.
2. Jalankan `npm run lint` sebelum membuat commit.
3. Tinjau `git diff` dan pastikan tidak ada secret atau file upload lokal.
4. Buat commit dengan pesan yang menjelaskan perubahan.

## Gaya pesan commit

Gunakan pesan singkat dalam bentuk perintah, misalnya:

- `docs: clarify local setup`
- `fix: validate class membership`
- `test: cover assessment rules`

Hindari memasukkan password, API key, file `.env`, `account.txt`, atau data pengguna ke repository.
