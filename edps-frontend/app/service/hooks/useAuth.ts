import { useSelector } from "react-redux";
import { userProfile } from "@/app/service/authSlice";
import { useGetMeQuery } from "@/api/auth";

export const useAuth = () => {
  const user = useSelector(userProfile);

  const { isLoading, isError } = useGetMeQuery(undefined, {
    skip: !!user,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isError,
  };
};