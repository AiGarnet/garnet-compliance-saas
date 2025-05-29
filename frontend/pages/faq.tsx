import { NextPage } from 'next';
import Head from 'next/head';
import FAQPage from '../components/FAQPage';

const FAQPageWrapper: NextPage = () => {
  return (
    <>
      <Head>
        <title>Frequently Asked Questions | Garnet AI</title>
        <meta name="description" content="Find answers to common questions about Garnet AI's compliance automation platform. Can't find what you're looking for? Ask us directly." />
        <meta property="og:title" content="Frequently Asked Questions | Garnet AI" />
        <meta property="og:description" content="Find answers to common questions about Garnet AI's compliance automation platform." />
        <meta property="og:type" content="website" />
      </Head>
      <FAQPage />
    </>
  );
};

export default FAQPageWrapper; 