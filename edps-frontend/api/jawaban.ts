import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import {
    GetJawabanUser,
    SubmitJawabanRequest,
    SubmitValidationRequest
} from "@/model/Jawaban";

export const addTagTypes = ['jawaban', 'file', 'periode', 'akreditasi'];

export const jawabanApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({
            getJawabanUserByPeriode: builder.query<APIResponse<GetJawabanUser>, string>({
                query: (id) => `/jawaban-user/${id}`,
                providesTags: ["jawaban"],
            }),

            submitJawaban: builder.mutation<APIResponse<any>, SubmitJawabanRequest>({
                query: (body) => ({
                    url: "/jawaban-user",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["jawaban", "akreditasi"],
            }),

            submitValidation: builder.mutation<APIResponse<any>, SubmitValidationRequest>({
                query: (body) => ({
                    url: "/jawaban-user/lpmi",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["jawaban", "akreditasi"],
            }),
            submitReview: builder.mutation<APIResponse<any>, SubmitValidationRequest>({
                query: (body) => ({
                    url: "/jawaban-user/assesor",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["jawaban", "akreditasi"],
            }),
            uploadFile: builder.mutation<APIResponse<any>, FormData>({
                query: (formData) => ({
                    url: "/jawaban-user/upload_file",
                    method: "POST",
                    body: formData,
                }),
                invalidatesTags: ["jawaban"],
            }),

            deleteFile: builder.mutation<APIResponse<any>, string>({
                query: (id_file) => ({
                    url: `/jawaban-user/upload_file/${id_file}`,
                    method: "DELETE",
                }),
                invalidatesTags: ["jawaban"],
            }),

            downloadAndSaveFile: builder.mutation<void, string>({
                queryFn: async (id_file, _queryApi, _extraOptions, fetchWithBQ) => {
                    const result = await fetchWithBQ({
                        url: `/jawaban-user/download_file/${id_file}`,
                        method: "GET",
                        credentials: "include",
                        responseHandler: (response) => response.blob(),
                    });

                    if (result.error) {
                        return { error: result.error };
                    }

                    const response = (result.meta as { response?: Response })?.response;
                    const blob = result.data as Blob;

                    const contentDisposition = response?.headers.get("content-disposition");
                    let filename = "file";

                    if (contentDisposition) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                        if (matches && matches[1]) {
                            filename = matches[1].replace(/['"]/g, "");
                        }
                    }

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", filename);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);

                    return { data: undefined };
                },
            }),
        }),
    });

export const {
    useGetJawabanUserByPeriodeQuery,
    useSubmitJawabanMutation,
    useSubmitReviewMutation,
    useSubmitValidationMutation,
    useUploadFileMutation,
    useDeleteFileMutation,
    useDownloadAndSaveFileMutation,
} = jawabanApi;