import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Navbar />
      <main className="p-4">
        <h1 className="text-2xl font-bold">Welcome to the Home Page</h1>
      </main>
    </>
  );
}
