'use client';

import { use, useState } from "react";
import { usePathname } from "next/navigation";
import {
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Box,
    Toolbar,
    ListItemIcon,
    Avatar
} from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { styled, useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { useLogoutMutation } from "@/api/auth";
import { useAuth } from "../service/hooks/useAuth";

const drawerWidth = 240;
const primaryPallate = {
    primary: '#800607',
    primaryLight: '#FEE9E7',
    primaryDark: '#5a0405',
    white: '#FFFFFF',
    text: '#2D3748',
    textLight: '#718096',
};

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
    open?: boolean;
}>(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
    backgroundColor: primaryPallate.white,
    color: primaryPallate.text,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    transition: theme.transitions.create(["margin", "width"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
        transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

interface SidebarItems {
    label: string;
    href: string;
    icon?: React.ReactNode;
    requiredRole: string[];
}

interface SidebarProps {
    items: SidebarItems[];
    children?: React.ReactNode;
}

export default function Sidebar({ items, children }: SidebarProps) {
    const { user } = useAuth();
    const theme = useTheme();
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    const [logout] = useLogoutMutation();
    const filteredItems = items.filter(item => item.requiredRole.includes(user?.role || ''));

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    // Same active color for all items, different hover effects
    const getHoverStyle = (itemHref: string) => {
        const isActive = pathname === itemHref;

        return {
            backgroundColor: isActive ? primaryPallate.white : 'transparent',
            color: isActive ? primaryPallate.primary : primaryPallate.white,
            borderRight: isActive ? `4px solid ${primaryPallate.primaryDark}` : '4px solid transparent',
            margin: '4px 8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            '&:hover': {
                backgroundColor: primaryPallate.white,
                color: primaryPallate.primary,
                transform: 'translateX(4px)',
            },
            '& .MuiListItemText-primary': {
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.95rem',
            },
        };
    };

    return (
        <Box sx={{ display: "flex", width: '100%' }}>
            <AppBar position="fixed" open={open}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            edge="start"
                            sx={{ mr: 2, ...(open && { display: 'none' }) }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body2">
                            {user?.email}
                        </Typography>

                        <Avatar
                            // src={user?.avatar || ""}
                            alt={user?.email || "User"}
                            sx={{ width: 36, height: 36 }}
                        >
                            {user?.email?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundImage: 'url("/red-bg.jpg")',
                        color: primaryPallate.white,
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
                variant="persistent"
                anchor="left"
                open={open}
            >
                <DrawerHeader>
                    <IconButton sx={{ color: '#FFFFFF' }} onClick={handleDrawerClose}>
                        {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </DrawerHeader>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Box px={2} mb={2}>
                        <img
                            src="/calvin-logo.png"
                            alt="Calvin Logo"
                            style={{ maxWidth: "100px", width: "100%", height: "auto", marginBottom: "8px" }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                            Sistem Evaluasi Diri<br />Program Studi CIT
                        </Typography>
                    </Box>

                    <List>
                        {filteredItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton
                                    href={item.href}
                                    sx={getHoverStyle(item.href)}
                                >
                                    {item.icon && (
                                        <ListItemIcon sx={{
                                            color: 'inherit',
                                            minWidth: '36px',
                                            '& svg': {
                                                fontSize: '1.2rem',
                                            }
                                        }}>
                                            {item.icon}
                                        </ListItemIcon>
                                    )}
                                    <ListItemText
                                        primary={item.label}
                                        sx={{
                                            '& .MuiTypography-root': {
                                                fontWeight: pathname === item.href ? '500' : '300',
                                                fontSize: '0.95rem',
                                            }
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Box>
                    <ListItem disablePadding>
                        <ListItemButton
                            sx={{
                                color: primaryPallate.white,
                                borderRadius: '8px',
                                margin: '4px 8px',
                                py: 1,
                                "&:hover": {
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                }
                            }}
                            onClick={logout}
                        >
                            <ListItemIcon sx={{ color: "inherit", minWidth: "36px" }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Log Out"
                                sx={{
                                    '& .MuiTypography-root': {
                                        fontSize: '0.95rem',
                                    }
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                </Box>
            </Drawer>

            <Main open={open}>
                <DrawerHeader />
                {children}
            </Main>
        </Box>
    );
}