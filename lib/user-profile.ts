export type UserProfile = {
  firstName: string;
  lastName: string;
  username: string;
  photoUri: string | null;
};

export const EMPTY_USER_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  username: '',
  photoUri: null,
};
