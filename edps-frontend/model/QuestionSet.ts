export interface QuestionSetItem {
  id_qs: string;
  versi: string;
  tahun_berlaku: string;
  id_lembaga: string;
  nama_lembaga: string | null;
  total_max_bobot: number;
  tanggal_aktif: string;
}

export interface GetQuestionSet {
    results: QuestionSetItem[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}