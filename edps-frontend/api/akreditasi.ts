import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import {
  GetAkreditasi,
  WeightSummary,
  AkreditasiRequest,
  DashboardInfokom,
  Akreditasi,
  DashboardEmba,
  AkreditasiHelp
} from "@/model/Akreditasi";

export const addTagTypes = ["akreditasi"];

export const akreditasiApi = baseApi
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (builder) => ({

      getAkreditasi: builder.query<
        APIResponse<GetAkreditasi>,
        {
          page?: number;
          per_page?: number;
          status?: string;
          tahun_berlaku?: string;
          fakultas?: string;
          id_qs?: string;
          id_prodi?: string;
          id_lembaga?: number;
          available?: boolean;
          only_null_assesor?: boolean;
          is_assesor_page?: boolean;
          is_home_page?: boolean;
        }
      >({
        query: (params) => ({
          url: "/akreditasi",
          method: "GET",
          params,
        }),
        providesTags: ["akreditasi"],
      }),
      getAkreditasiDropdown: builder.query<
        APIResponse<Akreditasi[]>,
        { id_prodi?: string; id_lembaga?: number }
      >({
        query: (params) => ({
          url: `/akreditasi/dropdown`,
          params,
        }),
        providesTags: ["akreditasi"],
      }),
      getTahunBerlaku: builder.query<
        APIResponse<string[]>,
        { id_prodi?: string }
      >({
        query: (params) => ({
          url: "/akreditasi/tahun-berlaku",
          method: "GET",
          params,
        }),
        providesTags: ["akreditasi"],
      }),

      postAkreditasi: builder.mutation<
        APIResponse<any>,
        AkreditasiRequest
      >({
        query: (body) => ({
          url: "/akreditasi",
          method: "POST",
          body,
        }),
        invalidatesTags: ["akreditasi"],
      }),

      putAkreditasi: builder.mutation<
        APIResponse<any>,
        {
          id: string;
          data: AkreditasiRequest;
        }
      >({
        query: ({ id, data }) => ({
          url: `/akreditasi/${id}`,
          method: "PUT",
          body: data,
        }),
        invalidatesTags: ["akreditasi"],
      }),
      getAkreditasiHelpId: builder.mutation<
        APIResponse<AkreditasiHelp>,
        string
      >({
        query: (id_akreditasi) => ({
          url: `/akreditasi/${id_akreditasi}`,
          method: "GET",
        }),
        invalidatesTags: ["akreditasi"],
      }),
      getWeightSummaryInfokom: builder.query<
        APIResponse<WeightSummary>,
        string
      >({
        query: (id) => ({
          url: `/akreditasi/${id}/weight-summary/infokom`,
          method: "GET",
        }),
        providesTags: ["akreditasi"],
      }),

      getWeightSummaryEmba: builder.query<
        APIResponse<WeightSummary>,
        string
      >({
        query: (id) => ({
          url: `/akreditasi/${id}/weight-summary/emba`,
          method: "GET",
        }),
        providesTags: ["akreditasi"],
      }),
      getDashboardInfokom: builder.query<
        APIResponse<DashboardInfokom>,
        string
      >({
        query: (id_qs) => ({
          url: `/akreditasi/dashboard/infokom`,
          method: "GET",
          params: { id_qs }
        }),
        providesTags: ["akreditasi"],
      }),
      getDashboardInfokomDetail: builder.query<
        APIResponse<DashboardInfokom>,
        string
      >({
        query: (id_akreditasi) => ({
          url: `/akreditasi/dashboard/detail/infokom`,
          method: "GET",
          params: { id_akreditasi }
        }),
        providesTags: ["akreditasi"],
      }),
      getDashboardEmbaDetail: builder.query<
        APIResponse<DashboardEmba>,
        string
      >({
        query: (id_akreditasi) => ({
          url: `/akreditasi/dashboard/detail/emba`,
          method: "GET",
          params: { id_akreditasi }
        }),
        providesTags: ["akreditasi"],
      }),
      getDashboardML: builder.query<
        APIResponse<any>,
        void
      >({
        query: () => ({
          url: `/ml-dashboard`,
          method: "GET",
        }),
        providesTags: ["akreditasi"],
      }),
    }),
  });

export const {
  useGetAkreditasiQuery,
  useLazyGetAkreditasiQuery,
  useGetAkreditasiDropdownQuery,
  useGetTahunBerlakuQuery,
  usePostAkreditasiMutation,
  usePutAkreditasiMutation,
  useGetWeightSummaryInfokomQuery,
  useLazyGetWeightSummaryInfokomQuery,
  useGetWeightSummaryEmbaQuery,
  useLazyGetWeightSummaryEmbaQuery,
  useGetDashboardInfokomQuery,
  useLazyGetDashboardInfokomDetailQuery,
  useGetDashboardInfokomDetailQuery,
  useLazyGetDashboardInfokomQuery,
  useGetDashboardEmbaDetailQuery,
  useLazyGetDashboardEmbaDetailQuery,
  useGetAkreditasiHelpIdMutation,
  useGetDashboardMLQuery,
  useLazyGetDashboardMLQuery
} = akreditasiApi;