using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Npgsql;
using Supabase;

namespace Worker
{
    public class MetadataWorker
    {
        private readonly string _supabaseUrl;
        private readonly string _supabaseServiceKey;
        private readonly string _connectionString;

        public MetadataWorker(string supabaseUrl, string supabaseServiceKey)
        {
            _supabaseUrl = supabaseUrl;
            _supabaseServiceKey = supabaseServiceKey;
            _connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
                ?? throw new Exception("DATABASE_URL environment variable not set");
        }

        public async Task ProcessPendingJobsAsync()
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // Get pending jobs
            var jobs = await GetPendingJobsAsync(conn);

            if (jobs.Count == 0)
            {
                return; // No pending jobs
            }

            Console.WriteLine($"Found {jobs.Count} pending job(s)");

            foreach (var job in jobs)
            {
                await ProcessJobAsync(conn, job);
            }
        }

        private async Task<List<ImportJob>> GetPendingJobsAsync(NpgsqlConnection conn)
        {
            var jobs = new List<ImportJob>();
            var cmd = new NpgsqlCommand(
                "SELECT id, project_id, access_filename, storage_path, storage_bucket " +
                "FROM import_jobs WHERE status = 'pending' LIMIT 10",
                conn);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                jobs.Add(new ImportJob
                {
                    Id = reader.GetGuid(0),
                    ProjectId = reader.GetGuid(1),
                    AccessFilename = reader.GetString(2),
                    StoragePath = reader.GetString(3),
                    StorageBucket = reader.GetString(4)
                });
            }

            return jobs;
        }

        private async Task ProcessJobAsync(NpgsqlConnection conn, ImportJob job)
        {
            Console.WriteLine($"Processing job {job.Id}: {job.AccessFilename}");

            try
            {
                // Update status to processing
                await UpdateJobStatusAsync(conn, job.Id, "processing", null);

                // Download file from Supabase Storage
                var localPath = await DownloadFileAsync(job);

                // Extract metadata
                var (queries, modules) = ExtractMetadata(localPath, job);

                // Save to database
                await SaveMetadataAsync(conn, job, queries, modules);

                // Update job status to completed
                await UpdateJobStatusAsync(conn, job.Id, "completed", null);

                // Cleanup
                File.Delete(localPath);

                Console.WriteLine($"✓ Completed job {job.Id}: {queries.Count} queries, {modules.Count} modules");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"✗ Failed job {job.Id}: {ex.Message}");
                await UpdateJobStatusAsync(conn, job.Id, "failed", ex.Message);
            }
        }

        private async Task<string> DownloadFileAsync(ImportJob job)
        {
            var client = new Client(_supabaseUrl, _supabaseServiceKey);
            await client.InitializeAsync();

            var bytes = await client.Storage
                .From(job.StorageBucket)
                .Download(job.StoragePath, (Supabase.Storage.TransformOptions?)null);

            var tempPath = Path.Combine(Path.GetTempPath(), $"{job.Id}_{job.AccessFilename}");
            await File.WriteAllBytesAsync(tempPath, bytes);

            Console.WriteLine($"  Downloaded to: {tempPath}");
            return tempPath;
        }

        private (List<QueryData> queries, List<ModuleData> modules) ExtractMetadata(string filePath, ImportJob job)
        {
            var queries = new List<QueryData>();
            var modules = new List<ModuleData>();

            // Initialize Access COM objects
            dynamic? dao = null;
            dynamic? access = null;
            dynamic? vbe = null;

            try
            {
                // DAO - Extract Queries
                var daoType = Type.GetTypeFromProgID("DAO.DBEngine.120");
                if (daoType == null)
                    throw new Exception("DAO.DBEngine.120 not found. Please install Microsoft Access Database Engine.");
                
                dao = Activator.CreateInstance(daoType);
                dynamic db = dao.OpenDatabase(filePath);

                Console.WriteLine($"  Extracting queries...");
                foreach (dynamic queryDef in db.QueryDefs)
                {
                    var queryName = (string)queryDef.Name;
                    
                    // Skip system queries
                    if (queryName.StartsWith("~") || queryName.StartsWith("MSys"))
                        continue;

                    var sql = (string)queryDef.SQL;
                    var queryType = GetQueryType(queryDef.Type);

                    queries.Add(new QueryData
                    {
                        ImportJobId = job.Id,
                        ProjectId = job.ProjectId,
                        AccessFilename = job.AccessFilename,
                        QueryName = queryName,
                        QueryType = queryType,
                        SqlText = sql,
                        SqlHash = ComputeHash(sql)
                    });
                }

                db.Close();
                Console.WriteLine($"  Found {queries.Count} queries");

                // VBIDE - Extract VBA Modules
                Console.WriteLine($"  Extracting VBA modules...");
                var accessType = Type.GetTypeFromProgID("Access.Application");
                if (accessType == null)
                    throw new Exception("Access.Application not found. Please install Microsoft Access or Access Runtime.");
                
                access = Activator.CreateInstance(accessType);
                access.OpenCurrentDatabase(filePath, false); // Open read-only
                vbe = access.VBE;

                if (vbe != null)
                {
                    dynamic vbProject = vbe.ActiveVBProject;
                    
                    foreach (dynamic vbComponent in vbProject.VBComponents)
                    {
                        var moduleName = (string)vbComponent.Name;
                        var moduleType = GetModuleType(vbComponent.Type);
                        
                        // Extract code
                        dynamic codeModule = vbComponent.CodeModule;
                        int lineCount = codeModule.CountOfLines;
                        string code = "";
                        
                        if (lineCount > 0)
                        {
                            code = codeModule.Lines(1, lineCount);
                        }

                        if (!string.IsNullOrWhiteSpace(code))
                        {
                            modules.Add(new ModuleData
                            {
                                ImportJobId = job.Id,
                                ProjectId = job.ProjectId,
                                AccessFilename = job.AccessFilename,
                                ModuleName = moduleName,
                                ModuleType = moduleType,
                                Code = code,
                                CodeHash = ComputeHash(code)
                            });
                        }
                    }
                }

                Console.WriteLine($"  Found {modules.Count} modules");
            }
            finally
            {
                // Cleanup COM objects
                if (access != null)
                {
                    try
                    {
                        access.CloseCurrentDatabase();
                        access.Quit();
                    }
                    catch { }
                    System.Runtime.InteropServices.Marshal.ReleaseComObject(access);
                }

                if (vbe != null)
                {
                    System.Runtime.InteropServices.Marshal.ReleaseComObject(vbe);
                }

                if (dao != null)
                {
                    System.Runtime.InteropServices.Marshal.ReleaseComObject(dao);
                }
            }

            return (queries, modules);
        }

        private string GetQueryType(int typeCode)
        {
            return typeCode switch
            {
                0 => "Select",
                48 => "Union",
                80 => "DDL",
                96 => "Crosstab",
                112 => "Action (Delete)",
                128 => "Action (Update)",
                144 => "Action (Append)",
                240 => "Action (Make-Table)",
                _ => $"Other ({typeCode})"
            };
        }

        private string GetModuleType(int typeCode)
        {
            return typeCode switch
            {
                1 => "Standard",
                2 => "Class",
                3 => "Form",
                100 => "Document",
                _ => $"Other ({typeCode})"
            };
        }

        private string ComputeHash(string text)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(text);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hash).ToLower();
        }

        private async Task SaveMetadataAsync(NpgsqlConnection conn, ImportJob job, List<QueryData> queries, List<ModuleData> modules)
        {
            // Save queries
            foreach (var query in queries)
            {
                var cmd = new NpgsqlCommand(
                    "INSERT INTO queries (import_job_id, project_id, access_filename, query_name, query_type, sql_text, sql_hash) " +
                    "VALUES (@import_job_id, @project_id, @access_filename, @query_name, @query_type, @sql_text, @sql_hash)",
                    conn);

                cmd.Parameters.AddWithValue("import_job_id", query.ImportJobId);
                cmd.Parameters.AddWithValue("project_id", query.ProjectId);
                cmd.Parameters.AddWithValue("access_filename", query.AccessFilename);
                cmd.Parameters.AddWithValue("query_name", query.QueryName);
                cmd.Parameters.AddWithValue("query_type", query.QueryType ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("sql_text", query.SqlText);
                cmd.Parameters.AddWithValue("sql_hash", query.SqlHash);

                await cmd.ExecuteNonQueryAsync();
            }

            // Save modules
            foreach (var module in modules)
            {
                var cmd = new NpgsqlCommand(
                    "INSERT INTO vba_modules (import_job_id, project_id, access_filename, module_name, module_type, code, code_hash) " +
                    "VALUES (@import_job_id, @project_id, @access_filename, @module_name, @module_type, @code, @code_hash)",
                    conn);

                cmd.Parameters.AddWithValue("import_job_id", module.ImportJobId);
                cmd.Parameters.AddWithValue("project_id", module.ProjectId);
                cmd.Parameters.AddWithValue("access_filename", module.AccessFilename);
                cmd.Parameters.AddWithValue("module_name", module.ModuleName);
                cmd.Parameters.AddWithValue("module_type", module.ModuleType);
                cmd.Parameters.AddWithValue("code", module.Code);
                cmd.Parameters.AddWithValue("code_hash", module.CodeHash);

                await cmd.ExecuteNonQueryAsync();
            }

            // Update counts
            var updateCmd = new NpgsqlCommand(
                "UPDATE import_jobs SET query_count = @query_count, module_count = @module_count WHERE id = @id",
                conn);
            updateCmd.Parameters.AddWithValue("query_count", queries.Count);
            updateCmd.Parameters.AddWithValue("module_count", modules.Count);
            updateCmd.Parameters.AddWithValue("id", job.Id);
            await updateCmd.ExecuteNonQueryAsync();
        }

        private async Task UpdateJobStatusAsync(NpgsqlConnection conn, Guid jobId, string status, string? errorMessage)
        {
            var cmd = new NpgsqlCommand(
                "UPDATE import_jobs SET status = @status, error_message = @error_message, " +
                "started_at = CASE WHEN @status = 'processing' THEN NOW() ELSE started_at END, " +
                "completed_at = CASE WHEN @status IN ('completed', 'failed') THEN NOW() ELSE completed_at END " +
                "WHERE id = @id",
                conn);

            cmd.Parameters.AddWithValue("id", jobId);
            cmd.Parameters.AddWithValue("status", status);
            cmd.Parameters.AddWithValue("error_message", errorMessage ?? (object)DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
    }

    public class ImportJob
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public string AccessFilename { get; set; } = "";
        public string StoragePath { get; set; } = "";
        public string StorageBucket { get; set; } = "";
    }

    public class QueryData
    {
        public Guid ImportJobId { get; set; }
        public Guid ProjectId { get; set; }
        public string AccessFilename { get; set; } = "";
        public string QueryName { get; set; } = "";
        public string? QueryType { get; set; }
        public string SqlText { get; set; } = "";
        public string SqlHash { get; set; } = "";
    }

    public class ModuleData
    {
        public Guid ImportJobId { get; set; }
        public Guid ProjectId { get; set; }
        public string AccessFilename { get; set; } = "";
        public string ModuleName { get; set; } = "";
        public string ModuleType { get; set; } = "";
        public string Code { get; set; } = "";
        public string CodeHash { get; set; } = "";
    }
}

