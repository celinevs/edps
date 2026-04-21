import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import { Lembaga } from "@/model/Lembaga";

export const addTagTypes = ['lembaga'];

export const lembagaApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({
            getLembaga: builder.query<APIResponse<Lembaga[]>, string | undefined>({
                query: (id_prodi) => ({
                    url: `/lembaga`,
                    params: id_prodi ? { id_prodi } : undefined,
                }),
                providesTags: ["lembaga"],
            }),
        }),
    });

export const {
    useGetLembagaQuery,
    useLazyGetLembagaQuery
} = lembagaApi;