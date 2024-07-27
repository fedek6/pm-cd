declare namespace NodeJS {
  interface ProcessEnv {
    FTP_HOST: string;
    FTP_USER: string;
    FTP_PASS: string;
    LOCAL_DIR: string;
    REMOTE_DIR: string;
    PORT: string;
    UPLOADS_LOCAL_DIR: string;
    UPLOADS_REMOTE_DIR: string;
    TOKEN: string;
    PROJECT: string;
  }
}
