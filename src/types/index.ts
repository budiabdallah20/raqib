export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE' | 'UNDISCLOSED';

export type AuthUser = {
  id: string;
  email: string | null;
  phone?: string | null;
  name: string;
  role: Role;
  studentCode?: string | null;
  gender?: Gender | string | null;
  avatarUrl?: string | null;
  faceEnrolled?: boolean;
  fingerprintEnrolled?: boolean;
  isActive?: boolean;
  approvedAt?: Date | string | null;
};

export type JwtPayload = {
  sub: string;
  role: Role;
  email?: string | null;
  /** معرّف الجلسة في السيرفر — إلزامي لإبطال التوكن */
  sid: string;
};
