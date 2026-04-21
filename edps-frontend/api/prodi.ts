import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import { GetProdi } from "@/model/Prodi";

export const addTagTypes = ['prodi'];

export const prodiApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({
            getProdi: builder.query<APIResponse<GetProdi[]>, void>({
                query: () => `/prodi`,
                providesTags: ["prodi"],
            }),
        }),
    });

export const {
    useGetProdiQuery,
    useLazyGetProdiQuery
} = prodiApi;