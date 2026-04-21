import { baseApi } from "@/app/service/baseApi";
import { APIResponse, PaginatedResponse } from "@/model/Common";
import { User, UserUpdateRequest, UserPostRequest } from "@/model/User";

export const addTagTypes = ['users'];

export const usersApi = baseApi
    .enhanceEndpoints({
        addTagTypes
    })
    .injectEndpoints({
        endpoints: (builder) => ({

            getusers: builder.query<APIResponse<PaginatedResponse<User>>,{ page?: number; per_page?: number }>({
                query: ({ page = 1, per_page = 5 }) => ({
                    url: "/users",
                    params: { page, per_page },
                }),
                providesTags: ["users"],
            }),

            postusers: builder.mutation<APIResponse<any>, UserPostRequest>({
                query: (body) => ({
                    url: "/users",
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["users"],
            }),

            updateusers: builder.mutation<APIResponse<any>, {id_user:string, body:UserUpdateRequest}>({
                query: ({id_user, body}) => ({
                    url: `/users/${id_user}`,
                    method: "PUT",
                    body,
                }),
                invalidatesTags: ["users"],
            }),

            deleteusers: builder.mutation<APIResponse<any>, string>({
                query: (id_user) => ({
                    url: `/users/${id_user}`,
                    method: "DELETE",
                }),
                invalidatesTags: ["users"],
            }),
        }),
    });

export const {
    useGetusersQuery,
    useLazyGetusersQuery,
    usePostusersMutation,
    useUpdateusersMutation,
    useDeleteusersMutation
} = usersApi;