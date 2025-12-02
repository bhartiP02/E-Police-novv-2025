// import authAxios from "./authAxiosServices";

// export const loginUser = async (username: string, password: string) => {
//   const response = await authAxios.post("/login", { username, password });
//   return response.data;
// };
import authAxios from "./authAxiosServices";

export const loginUser = async (email: string, password: string) => {
  const response = await authAxios.post("/login-email", {
    email,
    password,
  });
  return response.data;
};
