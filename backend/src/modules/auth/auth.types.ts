export type AuthMeResponse = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isAnonymous: boolean;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number | null;
  tokenType: string;
  user: {
    id: string;
    email: string | null;
  };
};
