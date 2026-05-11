import { z } from "zod";
import { RecommendationSchema, type Recommendation } from "./schemas";

const data: Recommendation[] = [
  {
    quote:
      "Working with Omhar Regidor completely changed how we handle customer retention and rewards. His ability to understand our business quickly and build a loyalty system that improved customer engagement was truly impressive. The professionalism, speed, and technical expertise he brought to the project exceeded our expectations.",
    name: "Management Team",
    title: "Noxa Loyalty Platform",
  },
  {
    quote:
      "Omhar Regidor helped us modernize our business with a system that made order management and customer transactions much easier. His ability to turn our ideas into a clean and functional solution gave us confidence to scale our operations.",
    name: "SweetBlooms Team",
    title: "Flower & Gift Shop Business",
  },
  {
    quote:
      "The systems and automation developed by Omhar Regidor significantly improved our workflow and team productivity. His understanding of both business operations and technology allowed us to focus more on growth while reducing manual work.",
    name: "JAZA Media Management",
    title: "Creative & Marketing Agency",
  },
  {
    quote:
      "Omhar Regidor delivered a streamlined sales management solution that helped us manage leads, organize client data, and improve our overall sales process. He was responsive, strategic, and highly reliable throughout the entire project.",
    name: "Operations Team",
    title: "Sales & CRM Solutions",
  },
  {
    quote:
      "Partnering with Omhar Regidor allowed us to organize our internal processes and automate repetitive tasks efficiently. His attention to detail and commitment to delivering quality solutions made a huge impact on our daily operations.",
    name: "Crisia Virtual Assistant Team",
    title: "Virtual Assistance Services",
  },
];

export const recommendations = z.array(RecommendationSchema).parse(data);
