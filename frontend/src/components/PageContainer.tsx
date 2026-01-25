import { Box, type BoxProps } from '@mui/material';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface PageContainerProps extends BoxProps {
  children: React.ReactNode;
}

const PageContainer = ({ children, sx, ...props }: PageContainerProps) => {
  return (
    <Box
      sx={{
        animation: `${fadeIn} 0.4s ease-out`,
        width: '100%',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
