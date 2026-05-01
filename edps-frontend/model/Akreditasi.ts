import { GetProdi } from "./Prodi";

export interface Akreditasi {
    id_akreditasi: string;
    nama_akreditasi: string;
    status: string;
    tahun_berlaku: string;

    total_skor_prodi: number;
    total_skor_lpmi: number;
    total_skor_assesor: number;

    prodi: GetProdi
    question_set: {
        id_qs: string;
        id_lembaga: number;
        nama_lembaga: string;
        total_max_bobot: number;
    }

    tanggal_mulai: string;
    tanggal_selesai: string;
    tanggal_selesai_lpmi: string;
    tanggal_pengisian: string;
    tanggal_validasi: string;
    tanggal_review: string;
    progress: number;
}

export interface Summary {
    in_progress: number;
    submitted: number;
    validated: number;
    reviewed: number;
}

export interface GetAkreditasi {
    results: Akreditasi[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    summary: Summary;
}

export interface AkreditasiParam {
    page?: number;
    per_page?: number;
    status?: string;
    tahun_berlaku?: string;
    fakultas?: string;
    id_qs?: string;
    id_prodi?: string;
    available?: boolean;
}

export interface AkreditasiRequest {
    tanggal_mulai: string;
    tanggal_selesai_prodi: string;
    tanggal_selesai_lpmi: string;
    nama_akreditasi: string;
    tahun_berlaku: string;
    id_qs: string;
    id_prodi: string;
}

export interface DetailQuestion {
    q_no: number;
    kode_kriteria: string;
    max_weight: number;
    skor_prodi: number;
    skor_lpmi: number;
    skor_assesor: number;
}

export interface WeightDetailInfokom {
    weight: number;
    questions: number;
    max_weight: number;
    prodi: number;
    lpmi: number;
    assesor: number;
    assesor_lpmi: number;
    detail_question: DetailQuestion[];
}

export interface KriteriaDetail {
    elemen_kriteria?: string;
    prodi: number;
    lpmi: number;
    assesor: number;
    weight: number;
    dimensi: string;
    mandatory_pass?: boolean;
    q_no?: number;
}

export interface KriteriaTable {
    kriteria: string;
    total_pertanyaan: number;
    total_prodi: number;
    total_lpmi: number;
    total_assesor: number;
    detail: KriteriaDetail[];
    max_weight: number;
    mandatory_pass?: boolean;
}

export interface WeightSummary {
    detail: WeightDetailInfokom[];
    kriteria_detail: KriteriaTable[];
    total_questions: number;

    nama_pengisi: string | null;
    nama_validator: string | null;

    total_prodi: number;
    total_lpmi: number;
    total_assesor: number;

    tanggal_pengisian: string;
    tanggal_validasi: string;
    tanggal_review: string;

    max_points: number;
}

export interface TableItem {
  weight: number;
  total_questions: number;
  prodi: number;
  lpmi: number;
  assesor: number;
  last_to_assesor: number;
  last_to_max: number;
  this_to_assesor: number;
  this_to_max: number;
  percentage: number;
}

export interface TableItem2 {
  kriteria: string;
  total_pertanyaan: number;
  total_prodi: number;
  total_lpmi: number;
  total_assesor: number;
  max_weight: number;
  mandatory_pass: boolean;
}

export interface Chart {
  labels: string[];
  datasets: ChartDataset;
}

export interface ChartDataset {
  prodi: number[];
  lpmi: number[];
  assesor: number[];
}

export interface DashboardInfokom {
  table: TableItem[];
  radar: Chart;
  bar: Chart;
}

export interface DashboardEmba {
  table: TableItem2[];
  radar: Chart;
  bar: Chart;
}

export interface AkreditasiHelp {
    tanggal_pengisian: string;
    tanggal_validasi: string;
    email_pengisi: string;
    email_validator: string;
    label_link?: string;
    link?: string;
    deskripsi_gambar?: string;
    gambar_path?: string;
}