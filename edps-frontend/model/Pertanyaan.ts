export interface IndikatorJawaban {
  skor: number;
  deskripsi: string;
}

export interface Pertanyaan {
  id_pertanyaan: string;
  deskripsi_pertanyaan: string;
  bobot: number;
  kode_kriteria: string;
  elemen_penilaian_lam: string;
  indikator_jawaban: IndikatorJawaban[];
  kriteria: string;
  q_no: number;
  mandatory?: boolean;
}


export interface PostPertanyaan {
  id_regulasi: string;
  deskripsi_pertanyaan: string;
  indikator_jawaban: IndikatorJawaban[];
}

export interface GetPertanyaan {
    jumlah_pertanyaan: number;
    pertanyaan: Pertanyaan[]
}