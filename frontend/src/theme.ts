import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    surfaceContainer?: string;
  }
  interface PaletteOptions {
    surfaceContainer?: string;
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6200EE', // Deeper, more vibrant violet
      light: '#BB86FC',
      dark: '#3700B3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#03DAC6', // Teal for nicer contrast/accents
      light: '#66FFF9',
      dark: '#018786',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F5FA', // Very light gray-blue tint, less sterile than #FEF7FF
      paper: '#FFFFFF',
    },
    surfaceContainer: '#FFFFFF',
    text: {
      primary: '#121212', // Slightly softer black
      secondary: '#606060',
    },
    error: {
      main: '#B00020',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Prefer Inter if available
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, letterSpacing: '0.0125em' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.025em' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 16, // More rounded
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F5FA',
          scrollbarColor: "#9e9e9e #f5f5f5",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "transparent",
            width: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#d1d1d1",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#a8a8a8",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a8a8a8",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Pill shape
          padding: '8px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:active': {
             transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(98, 0, 238, 0.2)', // Colored shadow
          '&:hover': {
            boxShadow: '0px 6px 16px rgba(98, 0, 238, 0.3)',
            backgroundColor: '#5600E8',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: alpha('#6200EE', 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Soft diffuse shadow
          border: '1px solid rgba(0,0,0,0.03)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 20,
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glassmorphism backdrop
          backdropFilter: 'blur(12px)',
          color: '#121212',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0px 24px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Reduced radius for list items, pill is fine but 12px is cleaner for sidebar
          margin: '4px 12px',
          padding: '10px 16px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: alpha('#6200EE', 0.1),
            color: '#6200EE',
            '&:hover': {
              backgroundColor: alpha('#6200EE', 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: '#6200EE',
            }
          },
          '&:hover': {
            backgroundColor: alpha('#000000', 0.03),
            transform: 'translateX(4px)', // Subtle movement
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#757575',
          minWidth: 40,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        filled: {
          border: '1px solid transparent',
        },
        outlined: {
          border: '1px solid #E0E0E0',
        },
      },
    },
  },
});

export default theme;
