import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return(
  <div className="min-h-screen bg-blue-100 text-white dark:bg-gray-900">
    <Component {...pageProps} />
  </div>
  );
}