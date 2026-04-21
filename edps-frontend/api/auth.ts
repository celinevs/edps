import { baseApi } from "@/app/service/baseApi";
import tokenService from "@/app/service/tokenService";
import { setCredentials, logout } from "@/app/service/authSlice";
import { APIResponse } from "@/model/Common";
import { User } from "@/model/User";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // googleLogin: builder.mutation({
    //   query: (code) => ({
    //     url: '/callback/google',
    //     method: 'GET',
    //     params: { code },
    //   }),
    //   async onQueryStarted(_, { queryFulfilled, dispatch }) {
    //     try {
    //       const { data } = await queryFulfilled;

    //       const { access_token, refresh_token, user } = data.data;

    //       tokenService.setTokens(access_token, refresh_token);
    //       dispatch(setCredentials({ user }));
    //     } catch {}
    //   },
    // }),

    getMe: builder.query<APIResponse<User>, void>({
      query: () => "/auth/me",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data.data));
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "DELETE",
        credentials: "include",
      }),
      async onQueryStarted(_, { dispatch }) {
        tokenService.clearTokens();
        dispatch(logout());
        window.location.href = "/login";
      },
    }),
  }),
});

export const {
  // useGoogleLoginMutation, 
  useGetMeQuery,
  useLogoutMutation } = authApi;