import { baseApi } from "@/app/service/baseApi";
import { APIResponse } from "@/model/Common";
import { QuestionSetItem, GetQuestionSet } from "@/model/QuestionSet";

export const addTagTypes = ["question-set"];

export const questionSetApi = baseApi
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getQuestionSetByProdi: builder.query<
        APIResponse<QuestionSetItem[]>,
        string
      >({
        query: (id_prodi) => ({
          url: "/question-set",
          method: "GET",
          params: { id_prodi },
        }),
        providesTags: ["question-set"],
      }),
      getQuestionSetPaginated: builder.query<
        APIResponse<GetQuestionSet>,
        {
          page?: number;
          per_page?: number;
        }
      >({
        query: (params) => ({
          url: "/question-set/pagination",
          method: "GET",
          params,
        }),
        providesTags: ["question-set"],
      }),

    }),
  });

export const {
  useGetQuestionSetByProdiQuery,
  useLazyGetQuestionSetByProdiQuery,
  useGetQuestionSetPaginatedQuery,
  useLazyGetQuestionSetPaginatedQuery
} = questionSetApi;