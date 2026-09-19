/**
 * Application and project data models.
 */

export type ApplicationType = 'web' | 'spa' | 'ssr' | 'hybrid';

export interface Application {
  id: string;
  name: string;
  description?: string;
  /** Base URL to test against */
  baseUrl: string;
  type: ApplicationType;
  /** Authentication config if the app requires login */
  authConfig?: AuthConfig;
  createdAt: string;
  updatedAt: string;
  /** Tags for filtering */
  tags: string[];
}

export interface AuthConfig {
  loginUrl: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  /** Test credentials — never production secrets */
  username: string;
  password: string;
  /** URL to expect after successful login */
  successUrl?: string;
}
