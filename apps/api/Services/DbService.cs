using Dapper;
using FoodApi.Models;
using Microsoft.Data.Sqlite;

namespace FoodApi.Services;

public class DbService
{
    private readonly string _dataDir;
    private readonly string? _pinnedVersion;

    private const string Query = """
        SELECT f.slug, f.name, f.type,
               f.calories, f.fat, f.sat_fat, f.protein, f.fiber,
               f.sodium, f.carbs, f.sugar, f.cholesterol, f.trans_fat,
               f.yield_kg_ha, f.emissions_per_kg, f.water_per_kg,
               f.green_water_per_kg, f.blue_water_per_kg, f.grey_water_per_kg,
               f.pesticide_insect_paf, f.pesticide_terrestrial_paf,
               f.pesticide_bee_hazard, f.pesticide_kg_per_kg_food,
               f.neuron_count, f.weight_kg, f.lifetime_output_kg, f.yield_fraction,
               f.offspring_deaths_per_animal, f.offspring_captivity_years,
               f.pasture_ha_per_kg_output,
               f.ch4_kg_per_kg_output, f.n2o_kg_per_kg_output, f.co2_kg_per_kg_output,
               f.bycatch_amount, f.bycatch_food_slug,
               feed.water_per_kg              AS feed_water_per_kg,
               feed.emissions_per_kg          AS feed_emissions_per_kg,
               feed.green_water_per_kg        AS feed_green_water_per_kg,
               feed.blue_water_per_kg         AS feed_blue_water_per_kg,
               feed.grey_water_per_kg         AS feed_grey_water_per_kg,
               feed.pesticide_insect_paf      AS feed_pesticide_insect_paf,
               feed.pesticide_terrestrial_paf AS feed_pesticide_terrestrial_paf,
               feed.pesticide_bee_hazard      AS feed_pesticide_bee_hazard,
               feed.pesticide_kg_per_kg_food  AS feed_pesticide_kg_per_kg_food,
               feed.land_m2_per_kg            AS feed_land_m2_per_kg,
               bycatch_animal.neuron_count    AS bycatch_neuron_count,
               bycatch_animal.weight_kg       AS bycatch_weight_kg,
               f.availability_gg, f.sentient_harm_explanation, f.land_types
        FROM   foods_normalized f
        LEFT JOIN foods_normalized feed
               ON feed.food_id = f.food_id AND feed.is_feed = 1 AND feed.region = f.region
        LEFT JOIN foods_normalized bycatch_animal
               ON bycatch_animal.slug = f.bycatch_food_slug AND bycatch_animal.is_feed = 0
              AND bycatch_animal.region = f.region
        WHERE  f.is_feed = 0 AND f.region = @Region
        """;

    // Regions built by the data pipeline (see services/data-pipeline/src/lib/regions.py)
    public static readonly string[] Regions = ["world", "us", "avg"];

    public DbService(IConfiguration config, IWebHostEnvironment env)
    {
        // DATA_DIR: use config if set, otherwise derive from the project root
        // (ContentRootPath = apps/api/, so ../../data/db = project root/data/db)
        _dataDir = config["DATA_DIR"]
            ?? Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "data", "db"));

        // DB_VERSION: pinned if set in config; otherwise the latest version is
        // re-resolved on every request so a rebuilt DB is picked up without a restart.
        _pinnedVersion = config["DB_VERSION"];
    }

    private string CurrentDbPath()
    {
        var version = _pinnedVersion ?? InferVersion(_dataDir);
        return Path.Combine(_dataDir, $"foods-normalized.{version}.db");
    }

    // Scans dataDir for foods-normalized.vN.db files and returns the highest version.
    private static string InferVersion(string dataDir)
    {
        var files = Directory.GetFiles(dataDir, "foods-normalized.*.db");
        if (files.Length == 0)
            throw new InvalidOperationException(
                $"No foods-normalized.*.db found in {dataDir}. Run 'npm run build-db' first.");

        return files
            .Select(filePath => Path.GetFileNameWithoutExtension(filePath).Replace("foods-normalized.", ""))
            .OrderByDescending(version => int.TryParse(version.TrimStart('v'), out int versionNumber) ? versionNumber : 0)
            .First();
    }

    public IEnumerable<FoodRow> LoadFoods(string region)
    {
        using var conn = new SqliteConnection($"Data Source={CurrentDbPath()};Mode=ReadOnly");
        return conn.Query<FoodRow>(Query, new { Region = region });
    }
}
