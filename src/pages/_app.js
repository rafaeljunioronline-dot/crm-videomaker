import BottomNav from '../components/BottomNav';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* A barra flutuante fica aqui embaixo e aparece em todo o app */}
      <BottomNav />
    </>
  );
}