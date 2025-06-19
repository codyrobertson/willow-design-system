export default function TestPage() {
  return (
    <div className="min-h-screen bg-purple-600 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-lg">This text should be white on purple background</p>
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4">
        <p className="text-white">This is a translucent card</p>
      </div>
    </div>
  );
}