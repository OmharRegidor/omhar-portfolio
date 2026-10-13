import { AutomationsSchema, type Automations } from "./schemas";

// Mirrors the /automations page (public/atelier/automations.html) and the
// scripted answers in public/atelier/ask-omhar.js. Keep to what the page says:
// no prices, dates, clients or availability. The chat repeats these facts.
const data: Automations = {
  platform: {
    name: "n8n",
    about:
      "n8n is a workflow automation tool that connects apps like Gmail, Shopify and Slack. Each workflow is a chain of steps called nodes that starts from a trigger such as a new email, a chat message or a daily schedule.",
  },
  workflows: [
    {
      slug: "cs-live-inbox",
      name: "CS Live Inbox",
      tools: ["n8n", "Gmail", "OpenAI"],
      howItWorks: [
        "A low-cost AI model first checks whether each new email needs a reply.",
        "The ones that do get a reply written by a stronger model with real order details and saved as a Gmail draft.",
        "Two models keep costs low.",
      ],
      humanInTheLoop:
        "Someone on the team reviews each draft and presses send. It never sends by itself.",
      page: "/automations#auto-live-inbox",
    },
    {
      slug: "daily-sales-pulse",
      name: "Daily Sales Pulse",
      tools: ["n8n", "Shopify", "Slack"],
      howItWorks: [
        "A scheduled run pulls the store's Shopify orders every day.",
        "A code step works out totals, trends and top products, then an AI model writes a short summary posted to the team's Slack.",
        "Code does the math and the AI only explains the numbers, so figures stay exact.",
      ],
      humanInTheLoop: "A person reads the summary and decides what to act on.",
      page: "/automations#auto-sales-pulse",
    },
    {
      slug: "sop-assistant",
      name: "SOP Assistant",
      tools: ["n8n", "Slack"],
      howItWorks: [
        "An AI agent that answers staff questions from the company's written procedures.",
        "The same assistant works in Slack and in a chat window, and the chat version remembers recent messages.",
      ],
      humanInTheLoop: "A person writes and updates those procedures.",
      page: "/automations#auto-sop",
    },
  ],
};

export const automations = AutomationsSchema.parse(data);
