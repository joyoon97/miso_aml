// 미소신협 AML Q&A — 푸시 알림 발송 함수 (Supabase Edge Function)
// 함수 이름: notify-push
// 질문 등록 시 → 관리자에게 알림 / 답변 등록 시 → 질문 올린 지점에게 알림

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  "mailto:admin@miso.example",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (table !== "questions") return new Response("ignored");

    let targets: any[] = [];
    let title = "";
    let body = "";

    if (type === "INSERT") {
      // 새 질문 → 관리자에게
      title = "새 질문이 등록되었습니다";
      body = "[" + (record.branch || "") + "] " + (record.title || "");
      const { data } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("role", "admin");
      targets = data || [];
    } else if (
      type === "UPDATE" &&
      record.answer &&
      (!old_record || old_record.answer !== record.answer)
    ) {
      // 답변 등록/수정 → 질문 올린 지점에게
      title = "질문에 답변이 등록되었습니다";
      body = record.title || "";
      const { data } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("branch", record.branch);
      targets = data || [];
    } else {
      return new Response("no-op");
    }

    const msg = JSON.stringify({ title, body });

    await Promise.all(
      targets.map(async (t) => {
        try {
          await webpush.sendNotification(t.subscription, msg);
        } catch (e: any) {
          // 만료된 구독은 정리
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", t.endpoint);
          }
        }
      })
    );

    return new Response("ok");
  } catch (e) {
    return new Response("error", { status: 500 });
  }
});
