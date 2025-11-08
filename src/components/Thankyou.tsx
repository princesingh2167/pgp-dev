import React from 'react';
//@ts-ignore
import thankyouImage from '../utils/Thankyou.jpg';

const Thankyou: React.FC = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center' as const,
      // padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
    },
    logo: {
      width: '100vw',
      marginBottom: '20px',
      height: '100vh',
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold' as const,
      marginBottom: '16px',
    },
    message: {
      fontSize: '18px',
      maxWidth: '500px',
      lineHeight: 1.5,
      marginBottom: '30px',
    },
    highlight: {
      color: '#fc4c02',
      fontWeight: 'bold' as const,
    },
    icon: {
      fontSize: '40px',
      marginBottom: '15px',
    },
  };

  return (
    <div style={styles.container}>
      <img
        src={thankyouImage}
        alt="Let's create, innovate and give shape your vision together!"
        style={styles.logo}
      />
    </div>
  );
};

export default Thankyou;
