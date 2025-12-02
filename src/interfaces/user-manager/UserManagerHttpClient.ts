import type { UserDTO } from "@/interfaces/user-manager/dto/user.dto";
import type { UserManagerI } from "@/interfaces/user-manager/UserManagerI";
import { BaseHttpClient } from "@/network/http/HttpClient";

/**
 * Example of a class that represents an implementation of an external http service
 */
export class UserManagerHttpClient extends BaseHttpClient implements UserManagerI {
  getUserById(id: string): Promise<UserDTO> {
    return this.get<UserDTO>(`/users/${id}`);
  }
}
