import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import { GetProdi } from "@/model/Prodi";
import { Fakultas } from "@/model/Prodi";

export const addTagTypes = ['prodi'];

export const prodiApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({
            getProdi: builder.query<APIResponse<GetProdi[]>, string | undefined>({
                query: (id_fakultas) => ({
                    url: `/prodi`,
                    params: id_fakultas
                        ? { id_fakultas }
                        : undefined,
                }),
                providesTags: ["prodi"],
            }),
            getFakultas: builder.query<APIResponse<Fakultas[]>, void>({
                query: () => `/fakultas`,
                providesTags: ["prodi"],
            }),
        }),
    });

export const {
    useGetProdiQuery,
    useLazyGetProdiQuery,
    useGetFakultasQuery,
    useLazyGetFakultasQuery
} = prodiApi;