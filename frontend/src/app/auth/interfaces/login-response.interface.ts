export interface LoginResponse {
    user:      User;
    token:     string;
    status:    boolean;
    expiresIn: number;
}

export interface User {
    _id:         string;
    name:        string;
    email:       string;
    password:    string;
    profile: Profile;
    permissions: Permission[];
    programs:    Permission[];
    createdAt:   Date;
    updatedAt:   Date;
}

export interface Permission {
    _id:       string;
    name:      string;
    value:     string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Profile {
    _id:      string;
    name:     string;
    services: string[];
    __v:      number;
}



