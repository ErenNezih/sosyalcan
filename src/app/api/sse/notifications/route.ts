import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { Query } from "@/lib/appwrite/helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send({ type: "connected" });

      const since = new Date(Date.now() - 30 * 1000).toISOString();
      const { databases } = getAppwriteAdmin();
      const dbId = APPWRITE.databaseId;
      const coll = APPWRITE.collections.notifications;

      const interval = setInterval(async () => {
        try {
          const res = await databases.listDocuments(dbId, coll, [
            Query.greaterThan("$createdAt", since),
            Query.orderDesc("$createdAt"),
            Query.limit(5),
          ]);
          for (const n of res.documents) {
            const uid = (n as unknown as { user_id?: string }).user_id;
            if (uid == null || uid === "" || uid === session?.$id) {
              send({
                type: "notification",
                id: n.$id,
                ...(n as object),
              });
            }
          }
        } catch {
          // ignore
        }
      }, 5000);
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
