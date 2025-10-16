using System;
using System.IO;
using System.Threading.Tasks;
using DotNetEnv;

namespace Worker
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Load environment variables from root .env file
            var rootEnvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", ".env");
            if (File.Exists(rootEnvPath))
            {
                Env.Load(rootEnvPath);
            }

            var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");
            var supabaseServiceKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");
            var pollIntervalMs = int.Parse(Environment.GetEnvironmentVariable("WORKER_POLL_MS") ?? "4000");

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseServiceKey))
            {
                Console.WriteLine("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
                return;
            }

            Console.WriteLine("Access Metadata Extraction Worker");
            Console.WriteLine("==================================");
            Console.WriteLine($"Supabase URL: {supabaseUrl}");
            Console.WriteLine($"Poll Interval: {pollIntervalMs}ms");
            Console.WriteLine();

            var worker = new MetadataWorker(supabaseUrl, supabaseServiceKey);

            // Start polling loop
            while (true)
            {
                try
                {
                    await worker.ProcessPendingJobsAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERROR: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }

                await Task.Delay(pollIntervalMs);
            }
        }
    }
}
