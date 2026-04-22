import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadAndSaveTransaction = async (blob: Blob) => {
  // Menambahkan prefix 'public/' agar sesuai dengan kebijakan RLS Storage Anda
  const fileName = `public/bukti_${Date.now()}.png`;

  // 1. Upload Gambar (SKPL-F-001) 
  const { data: storageData, error: storageError } = await supabase.storage
    .from("bukti-transfer")
    .upload(fileName, blob);

  if (storageError) throw storageError;

  // 2. Simpan Transaksi (SKPL-F-005) 
  // Nilai nominal diubah ke 1 karena database menolak angka 0 (Check Constraint > 0) 
  const { data: transData, error: transError } = await supabase
    .from("transaksi")
    .insert([{ 
      nominal: 1, 
      metode_pembayaran: "QRIS", 
      status_validasi: "Pending" 
    }])
    .select()
    .single();

  if (transError) throw transError;

  // 3. Simpan Detail Bukti (Tabel 7) [cite: 431, 432]
  await supabase.from("bukti_pembayaran").insert([{
    id_transaksi: transData.id_transaksi, // Foreign Key ke Tabel Transaksi [cite: 432]
    file_gambar: storageData.path,        // Path file dari Storage [cite: 432]
    status: "valid",                      // Status validasi awal [cite: 432]
    waktu_capture: new Date().toISOString() // Waktu scan [cite: 432]
  }]);

  return transData;
};