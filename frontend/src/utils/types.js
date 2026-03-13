export interface UserResponse {
    user: {
        id: string;
        username: string;
        role: string;
        is_active: boolean;
        is_superuser: boolean;
        created: Date;
        updated: Date;
    };
    access: string;
    refresh: string;
};