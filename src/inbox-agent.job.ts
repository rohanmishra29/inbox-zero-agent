defineJob({
  name: "inboxZeroAgent",
  description: "Fetch unread Gmail and triage each email as URGENT, FOLLOW_UP, or FYI.",
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
      return { total: 0, urgent: 0, follow_up: 0, fyi: 0, emails: [] };
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

    const emails = [];
    for (const email of messages) {
      const subject  = email.preview?.subject ?? email.subject ?? "(no subject)";
      const sender   = email.sender ?? "unknown";
      const body     = email.preview?.body ?? "";
      const priority = classify(subject, body, sender);
      emails.push({ subject, from: sender, priority, link: email.display_url ?? "" });
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
      emails,
    };
  },
});