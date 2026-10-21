export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
  permissions?: string[];
  passwordExpired?: boolean;
}

export interface SessionResponse {
  accessToken: string;
  user: SessionUser;
}
