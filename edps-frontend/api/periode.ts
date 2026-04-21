import { baseApi } from "@/app/service/baseApi";
import { APIResponse, PaginatedResponse } from "@/model/Common";
import { GetPeriode, PostPeriode, WeightSummary } from "@/model/Periode";

export const addTagTypes = ['periode'];

export const periodeApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({

            getPeriode: builder.query<APIResponse<PaginatedResponse<GetPeriode>>,{ page?: number; per_page?: number }>({
                query: ({ page = 1, per_page = 5 }) => ({
                    url: "/periode",
                    method: "GET",
                    params: { page, per_page },
                }),
                providesTags: ["periode"],
            }),

            postPeriode: builder.mutation<APIResponse<any>, PostPeriode>({
                query: (body) => ({
                    url: "/periode",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["periode"],
            }),

            getWeightSummary: builder.query<APIResponse<WeightSummary>, string>({
                query: (id_periode) => ({
                    url: `/periode/${id_periode}/weight-summary`,
                    method: "GET",
                }),
                providesTags: ["periode"],
            }),

        }),
    });

export const {
    useGetPeriodeQuery,
    useLazyGetPeriodeQuery,
    usePostPeriodeMutation,
    useGetWeightSummaryQuery,
    useLazyGetWeightSummaryQuery
} = periodeApi;