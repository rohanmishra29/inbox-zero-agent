const unread = await gmail.gmailFetchEmails({
  query: "is:unread",
  max_results: 10,
});

const messages = unread?.data?.messages ?? [];

if (!messages.length) {
  return { message: "Inbox is clean!" };
}

const results = [];
let labeled = 0;

for (const email of messages) {
  const subject = email.preview?.subject ?? email.subject ?? "(no subject)";
  const sender  = email.sender ?? "unknown";
  const body    = email.preview?.body ?? "";

  const aiResponse = await hrbr.ai.generate({
    prompt: `You are an inbox assistant. Analyze this email and reply ONLY as raw JSON with no markdown, no backticks, no extra text whatsoever:
{"priority":"URGENT"|"FOLLOW_UP"|"FYI","summary":"one sentence max 20 words","needsReply":true|false}

Rules:
- URGENT: deadlines, interviews, payments, security alerts, account issues, exam results, offer letters
- FOLLOW_UP: needs a reply but not urgent
- FYI: newsletters, receipts, promos, notifications, noreply senders

From: ${sender}
Subject: ${subject}
Body: ${body.slice(0, 300)}`,
    max_tokens: 80,
  });

  let priority = "FYI";
  let summary = body.slice(0, 80);
  let needsReply = false;

  try {
    const clean = aiResponse.text
      .trim()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(clean);
    priority   = parsed.priority   ?? "FYI";
    summary    = parsed.summary    ?? summary;
    needsReply = parsed.needsReply ?? false;
  } catch (e) {
    // fallback: try to extract priority from raw text
    if (aiResponse.text.includes("URGENT"))      priority = "URGENT";
    else if (aiResponse.text.includes("FOLLOW_UP")) priority = "FOLLOW_UP";
  }

  if (priority === "URGENT" && email.messageId) {
    await gmail.gmailAddLabelToEmail({
      message_id: email.messageId,
      add_label_ids: ["Label_1"],
    });
    labeled++;
  }

  results.push({ subject, from: sender, priority, summary, needsReply, link: email.display_url ?? "" });
}

results.sort((a, b) => {
  const order: Record<string, number> = { URGENT: 0, FOLLOW_UP: 1, FYI: 2 };
  return order[a.priority] - order[b.priority];
});

return { total: results.length, labeled, emails: results };


