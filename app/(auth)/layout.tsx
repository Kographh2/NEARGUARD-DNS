export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
