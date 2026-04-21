export interface User {
   id_user: string;
   username: string;
   email: string;
   role: string;
   nama_prodi: string;
   is_active: boolean;
   id_prodi: string;
}

export enum Roles {
	Admin = 'ADMIN',
    SuperAdmin = 'SUPERADMIN',
    Prodi = 'PRODI',
    LPMI = 'LPMI',
    UPPS = 'UPPS'
}

export interface UserUpdateRequest {
   role: string;
   is_active: boolean;
}


export interface UserPostRequest {
   email: string;
   role: string;
   username?: string;
   id_prodi?: string;
}
