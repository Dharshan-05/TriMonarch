import { query, queryOne } from '../db/query';
import { PoolClient } from 'pg';

export class TokenRevocationService {
  async revokeToken(
    jti: string,
    userId: string,
    expiresAt: Date,
    client?: PoolClient,
  ): Promise<void> {
    await query(
      `INSERT INTO auth_token_revocations (jti, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (jti) DO NOTHING;`,
      [jti, userId, expiresAt],
      client,
    );
  }

  async revokeAllUserTokens(userId: string, client?: PoolClient): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 86400 * 1000);
    await this.revokeToken(`ALL_SESSIONS_${userId}`, userId, expiresAt, client);
  }

  async isTokenRevoked(jti: string, userId?: string, client?: PoolClient): Promise<boolean> {
    try {
      if (userId) {
        const allSessions = await queryOne<{ jti: string }>(
          'SELECT jti FROM auth_token_revocations WHERE jti = $1;',
          [`ALL_SESSIONS_${userId}`],
          client,
        );
        if (allSessions) return true;
      }
      const row = await queryOne<{ jti: string }>(
        'SELECT jti FROM auth_token_revocations WHERE jti = $1;',
        [jti],
        client,
      );
      return row !== null;
    } catch {
      return false;
    }
  }

  async cleanupExpiredRevocations(client?: PoolClient): Promise<number> {
    const rows = await query<{ jti: string }>(
      'DELETE FROM auth_token_revocations WHERE expires_at < CURRENT_TIMESTAMP RETURNING jti;',
      [],
      client,
    );
    return rows.length;
  }
}

export const tokenRevocationService = new TokenRevocationService();
