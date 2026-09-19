import { getPlayerSession } from '@/lib/auth/session';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { answerRequestSchema, parseJsonBody, roomCodeSchema } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, unauthorized, withErrorHandling } from '@/lib/http';

/**
 * Submit one answer.
 *
 * The request body carries only which option was tapped. There is no field for a score,
 * a response time, or a player id — the score is computed server-side, the elapsed time
 * is measured from the stored question start against the server clock, and the player
 * is taken from the signed cookie. A crafted request can therefore change which option
 * was chosen and nothing else.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<'/api/rooms/[code]/answer'>,
): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    const params = await ctx.params;
    const code = roomCodeSchema.safeParse(params.code);
    if (!code.success) return badRequest('Mã phòng không hợp lệ.');

    const session = await getPlayerSession(code.data, now);
    if (!session) return unauthorized('Bạn chưa tham gia phòng này.');

    const body = await parseJsonBody(request, answerRequestSchema);
    if (!body.ok) return badRequest(body.message, 'INVALID_CHOICE');

    const engine = getEngine();
    const result = await engine.submitAnswer(
      code.data,
      session.playerId,
      body.data.questionIndex,
      body.data.choiceIndex,
      now,
    );

    if (!result.ok) {
      // A duplicate submission is a normal outcome of a double tap on a laggy phone,
      // so answer it with the player's current view instead of an error screen.
      if (result.error.code === 'ALREADY_ANSWERED') {
        const view = await engine.getPlayerView(code.data, session.playerId, now);
        if (view.ok) {
          return jsonOk({ accepted: false, reason: 'ALREADY_ANSWERED', view: view.value });
        }
      }
      return jsonError(result.error);
    }

    const view = await engine.getPlayerView(code.data, session.playerId, now);
    if (!view.ok) return jsonError(view.error);

    return jsonOk({
      accepted: true,
      // Correctness and points are withheld until the reveal; the view carries them
      // only once the room has moved to QUESTION_REVEAL.
      choiceIndex: result.value.choiceIndex,
      view: view.value,
    });
  });
}
