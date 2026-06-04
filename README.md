# \# InboxZero Agent

# 

# \*\*Harbor Agent Buildathon 2026 · Built by Rohan Kumar Mishra\*\*

# 

# Built for: myself — a student juggling IIT Madras coursework, NIT Hamirpur placements, and way too many unread emails.

# 

# \## The Problem

# 

# I get 30–50 emails a day across college portals, placement coordinators, internship threads, and newsletters. I miss the important ones in the noise.

# 

# \## What It Does

# 

# InboxZero Agent connects to my Gmail and triages every unread email in seconds:

# 

# \- URGENT — security alerts, deadlines, invoices, account warnings

# \- FOLLOW\_UP — emails that need a reply but are not on fire

# \- FYI — newsletters, promos, notifications I can ignore

# 

# Results are sorted by priority so I always see what matters first.

# 

# \## How to Run

# 

# hrbr exec -f src/inbox-agent.exec.ts

# 

# hrbr exec -f src/inbox-agent.job.ts

# 

# \## Stack

# 

# \- Harbor SDK — runtime, Gmail plugin

# \- Gmail MCP — gmail.gmailFetchEmails

# \- TypeScript — keyword-based triage classifier

# 

# \## Files

# 

# src/inbox-agent.exec.ts — Quick 5-email prototype

# src/inbox-agent.job.ts  — Published Harbor Function

# 

# \## Sample Output

# 

# URGENT    — Security alert (Google)

# URGENT    — Your account will become inactive (Upstox)

# FOLLOW\_UP — HackerRank is hiring (LinkedIn)

# FYI       — OOF Sale 50-80% off (Bewakoof)

# FYI       — Markets tumble again (Upstox Daily)

# 

# Built on Harbor SDK · Zonko Labs Frontier AI Lab · June 2026

