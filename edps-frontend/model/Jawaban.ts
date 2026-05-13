
export interface FileJawaban {
  id_file: string;
  file_name: string;
}

export interface JawabanUser {
  id_jawaban: string;

  q_no: number;

  jawaban_prodi: number;
  skor_prodi: number;

  jawaban_lpmi: number;
  skor_lpmi: number;
  note_lpmi: string;

  jawaban_assesor: number;
  skor_assesor: number;
  note_assesor: string;

  files: FileJawaban[];
}

export interface EmbaDosen {
  id_akreditasi?: string;
  user_role?: string;

  dosen_total?: number;
  dosen_tetap?: number;
  dosen_doktor?: number;
  dosen_magister?: number;
  dosen_guru_besar?: number;
  dosen_lektor_kepala?: number;
  dosen_lektor?: number;
  dosen_publikasi?: number;
  dosen_sertifikat?: number;

  evaluasi_integrasi?: string;
  rekomendasi_ak?: string;
  catatan_assesor?: string;
}

export interface JawabanRequestItem {
  q_no: number;
  jawaban: number;
}

export interface ValidationRequestItem {
  q_no: number;
  jawaban: number;
  note?: string;
}

export interface GetJawabanUser {
    jumlah_jawaban: number;
    jawaban: JawabanUser[];
    emba_dosen: EmbaDosen[];
    evaluasi_integrasi?: string;
    rekomendasi_ak?: string;
    catatan_assesor: string;
}

export interface SubmitJawabanRequest {
  id_akreditasi: string;
  id_qs: string;
  jawaban: JawabanRequestItem[];
  dosen?: EmbaDosen;
  is_submit?: boolean;
}

export interface SubmitValidationRequest {
  id_akreditasi: string;
  id_qs: string;
  jawaban: ValidationRequestItem[];
  is_submit?: boolean;
  evaluasi_integrasi?: string;
  rekomendasi_ak?: string;
  catatan_assesor?: string;
}

export interface UploadRequestItem {
  id_pertanyaan: string;
  id_periode: string;
  file: File;
}

export interface EmbaNotes {
    evaluasi_integrasi?: string;
    rekomendasi_ak?: string;
    catatan_assesor: string;
}