const unread = await gmail.gmailFetchEmails({
  query: "is:unread",
  max_results: 10,
});

const messages = unread?.data?.messages ?? [];

if (!messages.length) {
  return { message: "Inbox is clean!" };
}

function classify(subject: string, body: string, sender: string) {
  const text = (subject + " " + body + " " + sender).toLowerCase();
  const urgentKeywords = [
    "deadline", "urgent", "asap", "immediately", "due today",
    "due tomorrow", "interview", "offer letter", "result", "exam",
    "payment", "invoice", "overdue", "action required", "verify",
    "alert", "security", "suspended", "account", "expire", "inactive"
  ];
  const fiyKeywords = [
    "unsubscribe", "newsletter", "promo", "offer", "discount",
    "sale", "marketing", "notification", "noreply", "no-reply",
    "donotreply", "receipt", "order confirmed", "shipment"
  ];
  for (const k of urgentKeywords) if (text.includes(k)) return "URGENT";
  for (const k of fiyKeywords) if (text.includes(k)) return "FYI";
  return "FOLLOW_UP";
}

const results = [];
let labeled = 0;

for (const email of messages) {
  const subject  = email.preview?.subject ?? email.subject ?? "(no subject)";
  const sender   = email.sender ?? "unknown";
  const body     = email.preview?.body ?? "";
  const priority = classify(subject, body, sender);

  if (priority === "URGENT" && email.messageId) {
    await gmail.gmailAddLabelToEmail({
      message_id: email.messageId,
      add_label_ids: ["Label_1"],
    });
    labeled++;
  }

  results.push({ subject, from: sender, priority, snippet: body.slice(0, 100) });
}

results.sort((a, b) => {
  const order: Record<string, number> = { URGENT: 0, FOLLOW_UP: 1, FYI: 2 };
  return order[a.priority] - order[b.priority];
});

return { total: results.length, labeled, emails: results };