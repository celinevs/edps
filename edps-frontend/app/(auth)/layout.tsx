export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/red-bg.jpg')" }}>
            {children}
        </div>
    );
}