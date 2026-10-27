import './globals.css';

export const metadata = {
  title: 'StudyPop – Govt Exam PDF Practice',
  description: 'Upload a PDF, get questions, flashcards and a timed practice test. Everything stays on your device.',
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
