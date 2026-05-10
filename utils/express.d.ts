import type { ObjectId } from "mongodb";

interface AuthenticatedUser {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      file?: Express.Multer.File;
    }
  }
}

export {};
