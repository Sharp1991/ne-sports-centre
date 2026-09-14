import { supabase } from "@/lib/supabase";

export default async function TestDB() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .limit(5);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-black">Supabase Test</h1>

      {error ? (
        <pre className="mt-6 rounded-lg bg-red-100 p-4 text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      ) : (
        <pre className="mt-6 rounded-lg bg-gray-100 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
