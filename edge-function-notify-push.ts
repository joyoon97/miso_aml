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
    contactInformation: "mailto:joyoon97@gmail.com",
    vapidKeys: keys,
  });
  return appServer;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (table !== "questions" && table !== "notices" && table !== "discuss") return new Response("ignored");

    let targets: any[] = [];
    let title = "";
    let body = "";

    if (table === "notices" && type === "INSERT") {
      // 새 공지사항 → 전 지점 + 관리자 전원에게
      title = "새 공지사항이 등록되었습니다";
      body = record.title || "";
      const { data } = await supabase.from("push_subscriptions").select("*");
      targets = data || [];
    } else if (table === "discuss" && type === "INSERT") {
      // 새 토론 글 → 전 지점 + 관리자 전원에게 (알림 내역에는 남기지 않고 푸시/배지만)
      title = "새 토론 글이 등록되었습니다";
      body = (record.author || "") + ": " + (record.text || "");
      const { data } = await supabase.from("push_subscriptions").select("*");
      targets = data || [];
    } else if (table === "questions" && type === "INSERT") {
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

    if (targets.length === 0) {
      console.log("발송 대상 없음:", table, type);
      return new Response("no targets");
    }
    console.log("발송 대상 " + targets.length + "건:", targets.map((t) => t.branch + "/" + t.role));

    const server = await getServer();
    const msg = JSON.stringify({ title, body });

    const results = await Promise.all(targets.map(async (t) => {
      try {
        const subscriber = server.subscribe(t.subscription);
        await subscriber.pushTextMessage(msg, {});
        console.log("발송 성공:", t.branch, t.endpoint.slice(0, 60));
        return { ok: true };
      } catch (e: any) {
        const code = e?.response?.status ?? e?.statusCode;
        const errBody = e?.response ? await e.response.text().catch(() => "") : "";
        console.error("발송 실패:", t.branch, "status=" + code, "endpoint=" + t.endpoint.slice(0, 60), "detail=" + String(e) + " " + errBody);
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", t.endpoint);
          console.log("만료된 구독 삭제:", t.branch);
        }
        return { ok: false, code };
      }
    }));

    console.log("발송 결과 요약: 성공 " + results.filter((r) => r.ok).length + " / 실패 " + results.filter((r) => !r.ok).length);

    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("error: " + String(e), { status: 500 });
  }
});
