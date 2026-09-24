using System.Text.Json;
using Dapper;
using FoodApi.Services;

var builder = WebApplication.CreateBuilder(args);

// DATA_DIR, DB_VERSION and AllowedOrigins can come from appsettings.json or env vars.
// CreateBuilder already loads appsettings.json, appsettings.{Environment}.json, then
// env vars — so env vars win. Example: DATA_DIR=/path/to/data/db  AllowedOrigins__0=https://my-site.com

// Dapper: treat sat_fat (SQLite) as equivalent to SatFat (C#) when mapping rows.
// Without this, Dapper's default case-insensitive match still requires the same
// underscore structure — SatFat would NOT match sat_fat.
DefaultTypeMap.MatchNamesWithUnderscores = true;

// Serialise to snake_case so the JSON keys match the TypeScript RawFood type
// (e.g. SatFat → sat_fat, YieldKgHa → yield_kg_ha).
builder.Services.AddControllers().AddJsonOptions(opts =>
    opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower);

builder.Services.AddSingleton<DbService>();

var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();
app.UseRouting();
app.UseCors();
app.MapControllers();
app.Run();
