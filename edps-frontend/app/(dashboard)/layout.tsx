import Sidebar from "@/app/component/Sidebar";
import DashboardIcon from '@mui/icons-material/Dashboard';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import PersonIcon from '@mui/icons-material/Person';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

const sidebarItems = [
  { label: "Home", href: "/home", icon: <HomeOutlinedIcon />, requiredRole: ['SUPERADMIN', 'LPMI'] },
  { label: "User", href: "/user", icon: <PersonIcon />, requiredRole: ['ADMIN', 'SUPERADMIN'] },
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon />, requiredRole: ['ADMIN', 'SUPERADMIN', 'UPPS', 'LPMI', 'PRODI'] },
  { label: "Event", href: "/event", icon: <BorderColorIcon />, requiredRole: ['ADMIN', 'SUPERADMIN', 'UPPS', 'LPMI', 'PRODI'] },
  { label: "Accreditation Management", href: "/acc-management", icon: <DashboardIcon />, requiredRole: ['ADMIN', 'SUPERADMIN'] },
  { label: "Accreditation’s Question", href: "/question-list", icon: <CloudUploadOutlinedIcon />, requiredRole: ['ADMIN', 'SUPERADMIN'] },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Sidebar items={sidebarItems}>
      {children}
    </Sidebar>
  );
}