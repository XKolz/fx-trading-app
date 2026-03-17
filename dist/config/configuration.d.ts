declare const _default: () => {
    port: number;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    mail: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    fx: {
        apiKey: string;
        apiBaseUrl: string;
        cacheTtl: number;
    };
};
export default _default;
