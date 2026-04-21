import { BaseQueryFn, createApi, fetchBaseQuery, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
// import tokenService from "./tokenService";
// import { logout } from "./authSlice";

// let isRefreshing = false;

// const rawBaseQuery = fetchBaseQuery({
//   baseUrl: "http://localhost:5000",
//   prepareHeaders: (headers) => {
//     const token = tokenService.getAccessToken();

//     if (token) {
//       headers.set("Authorization", `Bearer ${token}`);
//     }

//     return headers;
//   },
// });

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5000",
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>
  = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      const errorData = result.error.data as any;
      const message = errorData?.message;

      if (message === "Token has expired") {
        const refreshResult = await rawBaseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          window.location.href = "/login";
        }
      }
      else {
        window.location.href = "/login";
      }
    }

    return result;
  };

// const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> 
// = async (args, api, extraOptions) => {
//   let result = await rawBaseQuery(args, api, extraOptions);

//   if (result.error && result.error.status === 401) {
//     const refreshToken = tokenService.getRefreshToken();

//     if (!refreshToken) {
//       api.dispatch(logout());
//       tokenService.clearTokens();
//       return result;
//     }

//     // Prevent multiple refresh calls
//     if (!isRefreshing) {
//       isRefreshing = true;

//       const refreshResult = await rawBaseQuery(
//         {
//           url: "/auth/refresh",
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${refreshToken}`,
//           },
//         },
//         api,
//         extraOptions
//       );
//       isRefreshing = false;

//       if (refreshResult.data) {
//         const newAccess = (refreshResult.data as any).data.access_token;
//         tokenService.setTokens(newAccess);
//       } else {
//         api.dispatch(logout());
//         tokenService.clearTokens();
//         return result;
//       }
//     } else {
//       api.dispatch(logout());
//       tokenService.clearTokens();
//       return result;
//     }

//     result = await rawBaseQuery(args, api, extraOptions);
//   }

//   return result;
// };

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});