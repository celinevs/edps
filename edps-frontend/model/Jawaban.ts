
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
    periode_info: {
      total_skor_prodi: number;
      total_skor_lpmi: number;
    }
}

export interface SubmitJawabanRequest {
  id_akreditasi: string;
  id_qs: string;
  jawaban: JawabanRequestItem[];
  is_submit?: boolean;
}

export interface SubmitValidationRequest {
  id_akreditasi: string;
  id_qs: string;
  jawaban: ValidationRequestItem[];
  is_submit?: boolean;
}

export interface UploadRequestItem {
  id_pertanyaan: string;
  id_periode: string;
  file: File;
}