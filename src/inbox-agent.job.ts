defineJob({
  name: "inboxZeroAgent",
  description: "Fetch unread Gmail, use AI to triage as URGENT/FOLLOW_UP/FYI, summarize each email, and auto-label URGENT emails in Gmail.",
  triggers: ["schedule"],
  input: {
    max_results: "number?",
  },
  async run(input) {
    const unread = await gmail.gmailFetchEmails({
      query: "is:unread",
      max_results: input.max_results ?? 10,
    });

    const messages = unread?.data?.messages ?? [];

    if (!messages.length) {
      return { total: 0, urgent: 0, follow_up: 0, fyi: 0, labeled: 0 };
    }

    const emails = [];
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
      } catch {
        if (aiResponse.text.includes("URGENT"))        priority = "URGENT";
        else if (aiResponse.text.includes("FOLLOW_UP")) priority = "FOLLOW_UP";
      }

      if (priority === "URGENT" && email.messageId) {
        await gmail.gmailAddLabelToEmail({
          message_id: email.messageId,
          add_label_ids: ["Label_1"],
        });
        labeled++;
      }

      emails.push({ subject, from: sender, priority, summary, needsReply, link: email.display_url ?? "" });
    }

    emails.sort((a, b) => {
      const order: Record<string, number> = { URGENT: 0, FOLLOW_UP: 1, FYI: 2 };
      return order[a.priority] - order[b.priority];
    });

    return {
      total: emails.length,
      urgent: emails.filter(e => e.priority === "URGENT").length,
      follow_up: emails.filter(e => e.priority === "FOLLOW_UP").length,
      fyi: emails.filter(e => e.priority === "FYI").length,
      labeled,
    };
  },
});