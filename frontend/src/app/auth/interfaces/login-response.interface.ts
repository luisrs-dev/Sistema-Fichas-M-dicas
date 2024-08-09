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
    phone:       string;
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
