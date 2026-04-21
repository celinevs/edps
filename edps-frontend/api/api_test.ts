import apiClient from "./client";
import { APIResponse, PaginatedResponse } from "@/model/Common";
import { GetPertanyaan } from "@/model/Pertanyaan";
import { GetPeriode, PostPeriode } from "@/model/Periode";
import { GetJawabanUser, SubmitJawabanRequest, UploadRequestItem } from "@/model/Jawaban";
import { GetProdi } from "@/model/Prodi";
import { GetRegulasi, VersiRegulasi } from "@/model/Regulasi";

export async function getPertanyaanByRegulasi(id_regulasi: string): Promise<APIResponse<GetPertanyaan>> {
  const res = await apiClient.get(`/pertanyaan/${id_regulasi}`);
  return res.data;
}

export async function getPeriode(page = 1, per_page = 5): Promise<APIResponse<PaginatedResponse<GetPeriode>>> {
  const res = await apiClient.get('/periode', { params: { page, per_page } });
  return res.data;
}

export async function getJawabanUserByPeriode(id_periode: string): Promise<APIResponse<GetJawabanUser>> {
  const res = await apiClient.get(`/jawaban-user/${id_periode}`);
  return res.data;
}

export async function postPeriode(payload: PostPeriode): Promise<APIResponse<any>> {
  const res = await apiClient.post('/periode', payload);
  return res.data;
}

export async function submitJawaban(payload: SubmitJawabanRequest): Promise<APIResponse<any>> {
  const res = await apiClient.post('/jawaban-user', payload);
  return res.data;
}

export async function submitReview(payload: SubmitReviewRequest): Promise<APIResponse<any>> {
  const res = await apiClient.post('/jawaban-user/lpmi', payload);
  return res.data;
}

export async function getProdi(): Promise<APIResponse<GetProdi[]>> {
  const res = await apiClient.get(`/prodi`);
  return res.data;
}

export async function getRegulasi(): Promise<APIResponse<GetRegulasi[]>> {
  const res = await apiClient.get(`/regulasi`);
  return res.data;
}

export async function getVersiRegulasi(id_prodi: string): Promise<APIResponse<VersiRegulasi[]>> {
  const res = await apiClient.get(`/versi-regulasi`, { params: { id_prodi: id_prodi }, });
  return res.data;
}

export async function uploadFile(formData: FormData): Promise<APIResponse<any>> {
  const res = await apiClient.post(`/jawaban-user/upload_file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function downloadFile(id_file: string) {
  const res = await apiClient.get(`/jawaban-user/download_file/${id_file}`, {
    responseType: "blob"
  });
  
  const contentDisposition = res.headers['content-disposition'];
  let filename = "file.pdf";
  
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (matches != null && matches[1]) { 
      filename = matches[1].replace(/['"]/g, '');
    }
  }
  
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteFile(id_file: string): Promise<APIResponse<any>> {
  const res = await apiClient.delete(`/jawaban-user/upload_file/${id_file}`);
  return res.data;
}