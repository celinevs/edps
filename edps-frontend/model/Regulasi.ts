export interface GetRegulasi {
  id_regulasi: string;
  nama_regulasi: string;
}

export interface PostRegulasi {
    nama_regulasi: string;
    deskripsi_regulasi: string;
}

export interface VersiRegulasi {
  id_versi: string;
  versi_regulasi: number;
  tahun_berlaku: number;  
  id_regulasi: string;
  nama_regulasi: string;
  total_max_bobot: number;
}