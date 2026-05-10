import type { ObjectId } from "mongodb";

interface AuthenticatedUser {
  id: string;
  _id: ObjectId;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
  profileImage?: string | null;
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
