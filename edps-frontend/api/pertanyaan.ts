import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import { GetPertanyaan } from "@/model/Pertanyaan";

export const addTagTypes = ['pertanyaan'];

export const pertanyaanApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({
            getPertanyaanByRegulasi: builder.query<APIResponse<GetPertanyaan>,string>({
                query: (id) => `/pertanyaan/${id}`,
                providesTags: ["pertanyaan"],
            }),
        }),
    });

export const {
    useGetPertanyaanByRegulasiQuery,
} = pertanyaanApi;