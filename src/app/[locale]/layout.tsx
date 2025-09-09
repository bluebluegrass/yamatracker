import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { ToastProvider } from '@/hooks/useToast';
import '../globals.css';

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({locale});

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </NextIntlClientProvider>
  );
}