import { upsertProfileUsername } from "@/features/auth/db/profileService";

const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 24;

export type UpdateProfileUsernameError =
  | "required"
  | "tooShort"
  | "tooLong"
  | "unknown";

type UpdateProfileUsernameResult =
  | { ok: true; username: string }
  | { ok: false; reason: UpdateProfileUsernameError };

export function normalizeUsername(value: string): string {
  return value.trim();
}

function validateUsername(value: string): UpdateProfileUsernameError | null {
  if (!value) return "required";
  if (value.length < USERNAME_MIN_LENGTH) return "tooShort";
  if (value.length > USERNAME_MAX_LENGTH) return "tooLong";
  return null;
}

export async function updateProfileUsername(
  userId: string,
  rawUsername: string,
): Promise<UpdateProfileUsernameResult> {
  const username = normalizeUsername(rawUsername);
  const validationError = validateUsername(username);

  if (validationError) {
    return { ok: false, reason: validationError };
  }

  try {
    await upsertProfileUsername(userId, username);
    return { ok: true, username };
  } catch (error) {
    console.error("Failed to update profile username:", error);
    return { ok: false, reason: "unknown" };
  }
}
