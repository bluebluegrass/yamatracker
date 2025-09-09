import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Handle case where locale might be undefined
  if (!locale) {
    console.warn('Locale is undefined, using default locale "en"');
    return {
      messages: (await import(`./messages/en.json`)).default,
      locale: 'en'
    };
  }
  
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    locale
  };
});
