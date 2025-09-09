import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          {t('title')}
        </h1>
        
        {/* Test Tailwind classes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Card 1</h2>
            <p className="text-gray-600">This card tests basic Tailwind styling.</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Test Card 2</h2>
            <p className="text-blue-600">This card tests color variations.</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Test Card 3</h2>
            <p className="text-green-600">This card tests responsive grid.</p>
          </div>
        </div>

        {/* Test custom classes from globals.css */}
        <div className="text-center">
          <div className="progress-counter">0/100</div>
          <div className="mountain-name completed">富士山</div>
          <div className="mountain-name not-completed">槍ヶ岳</div>
        </div>

        {/* Language switcher for testing */}
        <div className="text-center mt-8">
          <div className="inline-flex gap-4">
            <a href="/en" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">English</a>
            <a href="/ja" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">日本語</a>
            <a href="/zh" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">中文</a>
          </div>
        </div>
      </div>
    </div>
  );
}
