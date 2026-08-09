import "./globals.css";
import Providers from "../components/Providers";
import Footer from "../components/Footer";

export const metadata = {
  title: "The Dance Playlist Builder",
  description: "Build a YouTube playlist from the Just Dance catalog",
  icons:{
    icon: [
      {
        url: "icons8-dance-16.png",
        type:"image/png",
        sizes: "16x16"
      },
      {
        url: "icons8-dance-ios-27-outlined-32.png",
        type:"image/png",
        sizes: "32x32"
      },
      {
        url: "icons8-dance-ios-27-outlined-96.png",
        type:"image/png",
        sizes: "96x96"
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      <Footer />
      </body>
    </html>
  );
}