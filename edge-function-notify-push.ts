// 미소신협 AML Q&A — 푸시 알림 발송 함수 (Supabase Edge Function)
// 함수 이름: notify-push

import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// VAPID 키 (JWK 형식)
const VAPID_JWK = JSON.parse(Deno.env.get("VAPID_JWK")!);

let appServer: any = null;
async function getServer() {
  if (appServer) return appServer;
  const keys = await webpush.importVapidKeys(VAPID_JWK, { extractable: false });
  appServer = await webpush.ApplicationServer.new({
    contactInformation: "mailto:admin@miso.example",
    vapidKeys: keys,
  });
  return appServer;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (table !== "questions") return new Response("ignored");

    let targets: any[] = [];
    let title = "";
    let body = "";

    if (type === "INSERT") {
      title = "새 질문이 등록되었습니다";
      body = "[" + (record.branch || "") + "] " + (record.title || "");
      const { data } = await supabase
        .from("push_subscriptions").select("*").eq("role", "admin");
      targets = data || [];
    } else if (
      type === "UPDATE" && record.answer &&
      (!old_record || old_record.answer !== record.answer)
    ) {
      title = "질문에 답변이 등록되었습니다";
      body = record.title || "";
      const { data } = await supabase
        .from("push_subscriptions").select("*").eq("branch", record.branch);
      targets = data || [];
    } else {
      return new Response("no-op");
    }

    if (targets.length === 0) return new Response("no targets");

    const server = await getServer();
    const msg = JSON.stringify({ title, body });

    await Promise.all(targets.map(async (t) => {
      try {
        const subscriber = server.subscribe(t.subscription);
        await subscriber.pushTextMessage(msg, {});
      } catch (e: any) {
        // 만료된 구독 정리
        const code = e?.response?.status ?? e?.statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", t.endpoint);
        }
      }
    }));

    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("error: " + String(e), { status: 500 });
  }
});
