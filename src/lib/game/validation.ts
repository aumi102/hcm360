import { z } from 'zod';

import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from './config';
import { isValidRoomCodeShape, normaliseRoomCode } from './codes';
import { normaliseDisplayName } from './names';
import { HOST_ACTIONS } from './types';

/**
 * Every value that crosses the network boundary is parsed here before it reaches game
 * logic. Normalisation happens inside the schema (via `transform`) so a handler cannot
 * forget to call it.
 */

export const roomCodeSchema = z
  .string()
  .min(1, 'Thiếu mã phòng')
  .max(32, 'Mã phòng không hợp lệ')
  .transform(normaliseRoomCode)
  .refine((code) => isValidRoomCodeShape(code), {
    message: `Mã phòng phải gồm ${ROOM_CODE_LENGTH} chữ cái`,
  });

export const displayNameSchema = z
  .string()
  .max(200, 'Tên quá dài')
  .transform(normaliseDisplayName)
  .refine((name) => [...name].length >= 1, { message: 'Hãy nhập tên hiển thị' })
  .refine((name) => [...name].length <= MAX_NAME_LENGTH, {
    message: `Tên tối đa ${MAX_NAME_LENGTH} ký tự`,
  });

export const joinRequestSchema = z.object({
  displayName: displayNameSchema,
  /** Present when a returning player is reclaiming an existing session. */
  playerToken: z.string().min(1).max(200).optional(),
});

// Every bound carries its own Vietnamese message: these strings are rendered straight
// into the player UI, and Zod's defaults are English prose like "Too big: expected
// number to be <=3".
export const answerRequestSchema = z.object({
  questionIndex: z
    .number({ message: 'Thiếu số thứ tự câu hỏi.' })
    .int({ message: 'Số thứ tự câu hỏi không hợp lệ.' })
    .min(0, 'Số thứ tự câu hỏi không hợp lệ.')
    .max(99, 'Số thứ tự câu hỏi không hợp lệ.'),
  choiceIndex: z
    .number({ message: 'Thiếu phương án đã chọn.' })
    .int({ message: 'Lựa chọn không hợp lệ.' })
    .min(0, 'Lựa chọn không hợp lệ.')
    .max(3, 'Lựa chọn không hợp lệ.'),
});

export const hostActionSchema = z.object({
  action: z.enum(HOST_ACTIONS),
});

export const hostLoginSchema = z.object({
  secret: z.string().min(1, 'Hãy nhập mã quản trị').max(500),
});

export const createRoomSchema = z.object({
  /** Reserved for future alternative question sets; defaults to the Topic 8 set. */
  questionSetId: z.string().min(1).max(64).optional(),
});

export type JoinRequest = z.infer<typeof joinRequestSchema>;
export type AnswerRequest = z.infer<typeof answerRequestSchema>;
export type HostActionRequest = z.infer<typeof hostActionSchema>;
export type HostLoginRequest = z.infer<typeof hostLoginSchema>;
export type CreateRoomRequest = z.infer<typeof createRoomSchema>;

/**
 * Parse a JSON request body without letting a malformed body throw.
 *
 * Returns a flat Vietnamese message because these strings are rendered directly in the
 * player UI, where a raw Zod issue tree would be unreadable.
 */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; message: string }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? 'Dữ liệu gửi lên không hợp lệ.' };
  }

  return { ok: true, data: parsed.data };
}
