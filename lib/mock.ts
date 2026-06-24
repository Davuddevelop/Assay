/**
 * Stub session data for the mocked auth pass. A single user stands in until
 * Supabase GitHub OAuth is wired. Repos and checks come later.
 */
export type MockUser = {
  handle: string;
  name: string;
  initial: string;
};

export const mockUser: MockUser = {
  handle: "davud",
  name: "Davud",
  initial: "D",
};
