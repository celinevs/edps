import Questionbar from "../component/Questionbar";

export default function FormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Questionbar>
        <div style={{ padding: '10px' }}>
          {children}
        </div>
      </Questionbar>
    </div>
  );
}
