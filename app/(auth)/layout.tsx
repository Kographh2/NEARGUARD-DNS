export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-md">{children}</div>
    </div>
  );
}
