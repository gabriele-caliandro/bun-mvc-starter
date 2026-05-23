import type { AppError } from "@/errors/base/AppError";
import { UnauthorizedError } from "@/errors/domain/UnauthorizedError";
import * as jose from "jose";
import { err, ok, Result } from "neverthrow";

type User = {
  username: string;
  password: string;
  role: string;
};

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES_IN = 60 * 60 * 2; // 2h in seconds
  private readonly REFRESH_TOKEN_EXPIRES_IN = 1000 * 60 * 60 * 24 * 7; // 7d in milliseconds

  private users: Record<string, User>;
  private refresh_token_store: Map<string, { expires_at: number; username: string }> = new Map();

  constructor(
    users: User[],
    private readonly secret: string
  ) {
    this.users = users.reduce(
      (acc, user) => {
        acc[user.username] = user;
        return acc;
      },
      {} as Record<string, User>
    );
  }

  private generate_jwt(username: string, role: string): Promise<string> {
    const secret = new TextEncoder().encode(this.secret);
    const alg = "HS256";

    return new jose.SignJWT({ role: role })
      .setProtectedHeader({ alg })
      .setSubject(username)
      .setIssuedAt()
      .setExpirationTime(`${this.ACCESS_TOKEN_EXPIRES_IN}s`)
      .sign(secret);
  }

  async login(
    username: string,
    password: string
  ): Promise<
    Result<
      {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      },
      AppError
    >
  > {
    const user = this.users[username];
    if (!user) {
      return err(new UnauthorizedError("User not found"));
    }

    const res = await Bun.password.verify(password, user.password);
    if (res === false) {
      return err(new UnauthorizedError("Invalid credentials"));
    }

    const jwt = await this.generate_jwt(user.username, user.role);

    const refresh_token = crypto.randomUUID();
    this.refresh_token_store.set(refresh_token, {
      username: user.username,
      expires_at: Date.now() + this.REFRESH_TOKEN_EXPIRES_IN,
    });

    return ok({
      access_token: jwt,
      refresh_token: refresh_token,
      expires_in: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  async refresh_token(refresh_token: string): Promise<
    Result<
      {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      },
      AppError
    >
  > {
    const refresh_token_info = this.refresh_token_store.get(refresh_token);
    if (!refresh_token_info) {
      return err(new UnauthorizedError("Refresh token not found"));
    }

    // Validate refresh token expiration
    if (Date.now() > refresh_token_info.expires_at) {
      this.refresh_token_store.delete(refresh_token);
      return err(new UnauthorizedError("Refresh token expired"));
    }

    const user = this.users[refresh_token_info.username];
    if (!user) {
      return err(new UnauthorizedError("User not found"));
    }

    const jwt = await this.generate_jwt(user.username, user.role);

    // Rotate refresh token
    const new_refresh_token = crypto.randomUUID();
    this.refresh_token_store.set(new_refresh_token, {
      username: user.username,
      expires_at: Date.now() + this.REFRESH_TOKEN_EXPIRES_IN,
    });

    return ok({
      access_token: jwt,
      refresh_token: refresh_token,
      expires_in: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }
}
