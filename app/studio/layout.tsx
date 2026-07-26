import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "内容工作室",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
