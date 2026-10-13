const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user?: User;
    student?: User;
    access_token?: string;
    refresh_token?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  student_id?: string;
  is_active: boolean;
  is_verified: boolean;
  profile?: {
    country: string;
    avatar_url: string;
    bio: string;
    java_level: string;
    institution: string;
  };
  stats?: {
    overall_mastery_score: number;
    total_materials_generated: number;
    total_sessions: number;
  };
  github?: {
    linked: boolean;
    gh_login?: string;
    linked_at?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  country?: string;
}

class AuthApi {
  private getTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private normalizeOutput(result: AuthResponse): AuthResponse {
     if (result.success && result.data) {
        const at = result.data.access_token || result.data.accessToken;
        const rt = result.data.refresh_token || result.data.refreshToken;
        if (at && rt) this.setTokens(at, rt);

        const userObj = result.data.student || result.data.user;
        if (userObj) {
           localStorage.setItem('user', JSON.stringify(userObj));
           result.data.user = userObj; // normalize for UI contexts
        }
     } else if (!result.success && result.error) {
        // Surfaces the backend error field (e.g. "Email already registered") as message
        result.message = result.message || result.error;
     }
     return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return this.normalizeOutput(result);
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return this.normalizeOutput(result);
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /** URL that begins the Google OAuth flow (full-page redirect). */
  getGoogleAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/google/start`;
  }

  /** Exchange the one-time ticket from the Google callback for a real session. */
  async googleExchange(ticket: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });

      const result = await response.json();
      return this.normalizeOutput(result);
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async logout(): Promise<void> {
    const { accessToken } = this.getTokens();
    
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
    } catch {
      // Continue with logout even if API fails
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<boolean> {
    const { refreshToken } = this.getTokens();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const at = result.data.access_token || result.data.accessToken;
        const rt = result.data.refresh_token || result.data.refreshToken;
        if (at && rt) {
          this.setTokens(at, rt);
          return true;
        }
      }

      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { accessToken } = this.getTokens();
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getCurrentUser();
          }
        }
        throw new Error("API failed");
      }

      const result = await response.json();
      const userObj = result.data?.student || result.data?.user || result.data || result;
      if (userObj) {
         localStorage.setItem('user', JSON.stringify(userObj));
         return userObj;
      }
      return null;
    } catch {
      // Fallback to local storage if offline/failing
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
  }

  getAccessToken(): string | null {
    return this.getTokens().accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.getTokens().accessToken;
  }
}

export const authApi = new AuthApi();
export type { User, LoginData, RegisterData, AuthResponse };
