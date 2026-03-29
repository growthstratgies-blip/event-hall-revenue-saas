export const metadata = {
  title: "Event Hall Revenue SaaS",
  description: "Revenue calculator for event halls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
