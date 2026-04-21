import { GetRegulasi, VersiRegulasi } from "./Regulasi";
import { GetProdi } from "./Prodi";

export interface GetPeriode {
  id_periode: string;
  nama_periode: string;
  status: string;
  total_skor_prodi: number;
  total_skor_lpmi: number;
  total_skor_assesor: number;
  total_max_bobot: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_validasi: string;
  versi: VersiRegulasi;
  regulasi: GetRegulasi;
  prodi: GetProdi

}

export interface PostPeriode {
  tanggal_mulai: string;
  tanggal_selesai: string;
  tanggal_kadaluarsa: string;
  tahun_berlaku: string;
  id_versi: string;
  nama_periode: string;
  id_prodi: string;
}

export interface WeightDetail {
  weight: number;
  questions: number;
  max_weight: number;
  prodi: number;
  lpmi: number;
  assesor: number;
  assesor_lpmi: number;
}

export interface WeightSummary {
  total_questions: number;
  max_points: number;
  nama_pengisi: string;
  nama_validator: string;
  total_prodi: number;
  total_lpmi: number;
  total_assesor: number;
  detail: WeightDetail[];
  tanggal_pengisian: string;
  tanggal_validasi: string;
  tanggal_review: string;
}