import type { User } from "@/interfaces/user-manager/dto/user.dto";

export interface UserManagerI {
  getUserById(id: string): Promise<User>;
}
